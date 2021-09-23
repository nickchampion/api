/* eslint-disable no-use-before-define */
/* eslint-disable import/order */
const Boom = require('@hapi/boom');
const config = require('../configuration').config();
const errordite = require('../errordite');
const stripe = require('stripe')(config.stripe.secretKey, {
  apiVersion: '2020-03-02',
});
const cache = require('../cache');

const { ORDER_STATUS, STRIPE_PAYMENT_STATUS, PAYMENT_PROVIDERS, REFUND_STATUS } = require('../../constants');
const { tryExecuteAsync } = require('../../utils/common');

const refund = async (context, payment) => {
  context.audit.stripe = await stripe.refunds.create({
    amount: Math.round(payment.amount * 100),
    payment_intent: context.order.payments.find((p) => p.provider === PAYMENT_PROVIDERS.Stripe).paymentIntentId,
  });
  payment.status = REFUND_STATUS.Paid;
  payment.refundedAt = new Date().toISOString();
  payment.refundId = context.audit.stripe.id;
};

const cancel = async (context, payment) => {
  payment.cancelledAt = new Date().toISOString();

  try {
    await stripe.paymentIntents.cancel(payment.paymentIntentId);
  } catch (e) {
    if (e.code === 'payment_intent_unexpected_state' && e.payment_intent.status === STRIPE_PAYMENT_STATUS.Cancelled) {
      // we've already captured so continue as if successful
      return;
    }
    throw e;
  }
};

const create = async (context, payment) => {
  context.payment = context.subscription
    ? await createRecurringPayment(context.order, context.user, payment)
    : await createPaymentIntent(context.order, context.user, payment);

  if (context.subscription && (context.payment.error || !context.payment.complete))
    throw Boom.badRequest(context.payment.error || 'User action required for subsequent subscription payment, cannot take payment');

  payment.paymentIntentId = context.payment.id;

  if (!context.subscription && context.payment.error) throw Boom.badRequest(context.payment.error);
};

const capture = async (context, payment, amount) => {
  context.payment = await getPaymentIntent(payment.paymentIntentId);

  if (!context.payment) throw Boom.notFound('COMMON_NOT_FOUND', ['PaymentIntent', payment.paymentIntentId]);

  // if payment intent is not in a complete status (requires capture or succeeded) we cant proceed so throw error
  if (!context.payment.complete) throw Boom.badImplementation('STRIPE_PAYMENT_INTENT_INVALID_STATE', ['Capture Payment', context.payment.status]);

  context.payment = await capturePaymentIntent(context.payment.id, amount);
  context.payment.captureAmount = amount;

  payment.capturedAt = new Date().toISOString();
  payment.captureAmount = amount;

  if (context.payment.status !== STRIPE_PAYMENT_STATUS.Succeeded)
    throw Boom.badImplementation('STRIPE_PAYMENT_INTENT_INVALID_STATE', ['capture payment', context.payment.status]);
};

const createAccount = async (user) => {
  if (!user.stripeId) {
    const existing = await stripe.customers.list({
      limit: 1,
      email: user.email,
    });

    if (existing.data.length > 0) {
      user.stripeId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || 'Unknown'} ${user.lastName || 'Unknown'}`,
        metadata: {
          id: user.id,
        },
      });

      user.stripeId = customer.id;
    }

    cache.del(`user-${user.id}`);
    return true;
  }

  return false;
};

/*
Used when creating a payment for new subscription orders
*/
const createRecurringPayment = async (order, user, payment) => {
  const pi = constructPaymentIntent(order, user, payment);

  // this should only be set when creating the initial payment intent when customer is in checkout
  delete pi.setup_future_usage;

  // indicates the customer is not present
  pi.off_session = true;

  // add subscription Id to metadata
  pi.metadata.subscriptionId = order.subscriptionId;

  // create the payment at Stripe
  const paymentIntent = await stripe.paymentIntents.create(pi);

  // try to determine the next order status from the paymentIntent, if this fails we need to return the payment so it gets rolled back in
  // the calling code so dont let this fail and throw error otherwise we wont have the payment object to rollback
  const result = await tryExecuteAsync(() => determineTransition(paymentIntent), true, false, {
    orderId: order.id,
    userId: user.id,
  });

  // if we failed to determine the next transition return the error added to the payment intent
  if (result.failed) {
    paymentIntent.error = result.error;
    return paymentIntent;
  }

  return result;
};

const createPaymentIntent = async (order, user, payment) => {
  // create account if it does not exist
  const issueAuthToken = await createAccount(user);

  // construct a new paymentIntent for this checkout
  const pi = constructPaymentIntent(order, user, payment);

  // attempt to create the paymentIntent
  const paymentIntent = await stripe.paymentIntents.create(pi);

  // add flag to the payment to indicate if we created a new account for the user
  paymentIntent.issueAuthToken = issueAuthToken;

  // try to determine the next order status from the paymentIntent, if this fails we need
  // to return the payment so it gets rolled back in the calling code
  const result = await tryExecuteAsync(() => determineTransition(paymentIntent), true, false, {
    orderId: order.id,
    userId: user.id,
  });

  // if we failed to determine the next transition return the error added to the payment intent
  if (result.failed) {
    paymentIntent.error = result.error;
    return paymentIntent;
  }

  return result;
};

const constructPaymentIntent = (order, user, payment) => {
  return {
    amount: Math.round(payment.amount * 100),
    currency: order.currency.toLowerCase(),
    payment_method_types: ['card'],
    customer: user.stripeId,
    confirm: true,
    capture_method: 'manual',
    receipt_email: user.email,
    metadata: {
      orderId: order.code,
      cartId: order.cartId || null,
      tag: config.tag,
    },
    payment_method: payment.paymentMethodId,
    shipping: {
      name: `${order.shipping.firstName} ${order.shipping.lastName}`,
      phone: order.shipping.phone,
      address: {
        line1: order.shipping.address1,
        line2: order.shipping.address2,
        city: order.shipping.city,
        country: order.shipping.country,
        postal_code: order.shipping.zipcode,
        state: order.shipping.state,
      },
    },
    statement_descriptor_suffix: order.code,
    setup_future_usage: 'off_session',
  };
};

const getStoredCards = async (credentials) => {
  if (!credentials.stripeId) return [];

  const cards = await cache.get(`cards:${credentials.id}`, async () => {
    try {
      const pm = await stripe.paymentMethods.list({
        customer: credentials.stripeId,
        type: 'card',
      });

      const mapped = pm.data.map((p) => {
        return {
          id: p.id,
          type: p.card.brand,
          expiryMonth: p.card.exp_month,
          expiryYear: p.card.exp_year,
          lastFour: p.card.last4,
          isDefault: false,
        };
      });

      if (mapped.length > 0) mapped[0].isDefault = true;
      return mapped;
    } catch (e) {
      errordite.log(e);
      return null;
    }
  });

  return cards || [];
};

/*
Determine the next order status based on the current payment status
*/
const determineTransition = async (paymentIntent, firstIteration = true) => {
  // indicator as to whether we've authorised or captured payment, if so we can start t he order fulfilment process
  paymentIntent.complete = false;

  switch (paymentIntent.status) {
    case STRIPE_PAYMENT_STATUS.RequiresConfirmation: {
      if (firstIteration) {
        // should not really happen as we request to confirm as part of the payment intent creation process
        // eslint-disable-next-line no-param-reassign
        paymentIntent = await confirmPaymentIntent(paymentIntent.id, paymentIntent.payment_method);
        return determineTransition(paymentIntent, false);
      }
      paymentIntent.transitionTo = ORDER_STATUS.Pending;

      break;
    }
    case STRIPE_PAYMENT_STATUS.RequiresAction: {
      paymentIntent.transitionTo = ORDER_STATUS.Pending;
      break;
    }
    case STRIPE_PAYMENT_STATUS.Succeeded:
    case STRIPE_PAYMENT_STATUS.RequiresCapture: {
      paymentIntent.transitionTo = ORDER_STATUS.PaymentTaken;
      paymentIntent.complete = true;
      paymentIntent.deleteCart = true;
      paymentIntent.requiresCapture = paymentIntent.status === STRIPE_PAYMENT_STATUS.RequiresCapture;
      break;
    }
    case STRIPE_PAYMENT_STATUS.Cancelled: {
      paymentIntent.transitionTo = ORDER_STATUS.Cancelled;
      break;
    }
    case STRIPE_PAYMENT_STATUS.Processing: {
      paymentIntent.transitionTo = ORDER_STATUS.Pending;
      paymentIntent.deleteCart = true;
      break;
    }
    default:
      break;
  }

  return paymentIntent;
};

const confirmPaymentIntent = async (piId, pmId) => {
  stripe.paymentIntents.confirm(piId, {
    payment_method: pmId,
  });
};

const capturePaymentIntent = async (piId, amount) => {
  try {
    const r = await stripe.paymentIntents.capture(piId, {
      amount_to_capture: Math.round(amount * 100),
    });
    return r;
  } catch (e) {
    if (e.code === 'payment_intent_unexpected_state' && e.status === STRIPE_PAYMENT_STATUS.Succeeded) {
      // we've already captured so continue as if successful
      return e.payment_intent;
    }
    throw e;
  }
};

const detachPaymentMethod = async (pmId) => {
  await stripe.paymentMethods.detach(pmId);
};

const getPaymentIntent = async (piId) => {
  const pi = await stripe.paymentIntents.retrieve(piId);
  const r = await determineTransition(pi);
  return r;
};

const constructEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
};

module.exports = {
  create,
  capture,
  cancel,
  refund,
  confirmPaymentIntent,
  capturePaymentIntent,
  constructEvent,
  getStoredCards,
  getPaymentIntent,
  determineTransition,
  detachPaymentMethod,
};
