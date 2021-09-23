const _ = require('lodash');
const stripe = require('./stripe');
const AuditLog = require('../audit');
const math = require('../../utils/math');
const common = require('../../utils/common');
const { PAYMENT_PROVIDERS, ORDER_STATUS, REFUND_STATUS, AUDIT_EVENTS } = require('../../constants');

const providers = {
  stripe,
};

const refund = async (context) => {
  const promises = [];

  context.audit = {};
  context.refund.payments
    .filter((p) => p.status !== REFUND_STATUS.Paid)
    .forEach((p) => {
      const r = providers[p.provider].refund(context, p);

      if (common.isPromise(r)) {
        promises.push(r);
      }
    });

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  context.refund.status = REFUND_STATUS.Paid;
  context.refund.items.forEach((i) => (i.status = REFUND_STATUS.Paid));

  // audit
  await new AuditLog(AUDIT_EVENTS.Order_StateChange)
    .withMessage(`Refund on order paid`)
    .withOrder(context.order.id)
    .withOrderCode(context.order.code)
    .withUser(context.order.userId)
    .withData({
      provider: context.audit,
      refund: context.refund,
    })
    .store(context.session);

  return {
    success: true,
    order: context.order,
    user: context.user,
    refund: context.refund,
  };
};

const create = async (context) => {
  const promises = [];
  context.order.payments.forEach((p) => {
    const r = providers[p.provider].create(context, p);
    if (common.isPromise(r)) promises.push(r);
  });

  if (promises.length > 0) {
    await Promise.all(promises);
  }
};

/**
 * Here we capture / confirm a payment for items on an order. We may need to split the capture amount across multiple payments
 * if we've paid with credits and some other payment method. This allows us to do multiple captures so we can take payment for items at
 * different times
 * @param context
 */
const capture = async (context) => {
  // check to see if we've already captured payment, this can be trigger by multiple state changes
  if (context.order.payments.some((p) => p.capturedAt)) return;

  const payment = context.order.payments.find((p) => p.provider === PAYMENT_PROVIDERS.Stripe);

  // only capture payment for items that in payment taken state
  const itemTotal = _.sum(context.order.items.filter((i) => i.status === ORDER_STATUS.PaymentTaken).map((i) => i.salePrice));
  const cartDiscountTotal = _.sum(context.order.discounts.applied.map((d) => d.total));
  const amountToPay = math.round(context.order.shippingTotal + context.order.consultationFee + itemTotal - cartDiscountTotal);

  if (payment) {
    if (amountToPay > 0) {
      await providers[payment.provider].capture(context, payment, amountToPay);
    } else {
      await providers[payment.provider].cancel(context, payment);
    }
  }
};

const cancel = async (context) => {
  await Promise.all(context.order.payments.map((p) => providers[p.provider].cancel(context, p)));
};

const conditionalCancel = async (context) => {
  if (context.order.payments.some((p) => p.capturedAt)) return;

  const contextItemIds = context.items.map((s) => s.id);

  if (context.order.items.every((i) => i.status === ORDER_STATUS.Cancelled || contextItemIds.includes(i.id))) {
    await cancel(context);
  }
};

const deleteCard = async (cardId) => {
  await stripe.detachPaymentMethod(cardId);
};

const getStoredCards = async (cardId) => {
  return stripe.getStoredCards(cardId);
};

const getPaymentMethods = (provider) => {
  return [
    {
      provider: PAYMENT_PROVIDERS.Stripe,
      name: 'Credit / Debit Card',
      description: 'We accept Visa, Mastercard, and American Express.',
      selected: provider === PAYMENT_PROVIDERS.Stripe,
    },
  ];
};

module.exports = {
  create,
  capture,
  cancel,
  conditionalCancel,
  deleteCard,
  getStoredCards,
  getPaymentMethods,
  refund,
};
