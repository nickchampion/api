const Boom = require('@hapi/boom');
const stateMachine = require('./stateMachine');
const errordite = require('../errordite');
const raven = require('../ravendb');
const shipping = require('../shipping');
const payments = require('../payments');
const taxonomy = require('../taxonomy');
const config = require('../configuration').config();
const map = require('../map');
const jwt = require('../../utils/jwt');
const factory = require('./factory');
const { tryExecuteAsync } = require('../../utils/common');
const { ORDER_STATUS, SHIPPING_TYPE } = require('../../constants');

async function get(request, id, userId) {
  const order = await request.context.session.get(raven.Models.Order.getId(id), {
    user: 'userId',
    refund: 'refundId',
  });

  if (!order || (userId && order.userId !== userId)) throw Boom.notFound('COMMON_MODEL_NOT_FOUND', ['Order', id]);

  return map.order(request.context, order, await taxonomy.getCategories(), null, false);
}

async function query(request, userId, orderMap) {
  request.query.orderBy = '-createdAt';

  if (userId) request.query.userId = raven.Models.User.getId(userId);

  const orders = await request.context.session.search(raven.Models.Order, {
    user: 'userId',
  });

  return orderMap ? orderMap(orders) : map.orders(request.context, orders, await taxonomy.getCategories(), false);
}

async function addComment(context) {
  const order = await context.session.get(raven.Models.Order.getId(context.params.id));

  if (order) {
    order.comments.push({
      user: context.user.email,
      comment: context.payload.comment,
    });

    return order.comments;
  }

  return [];
}

/*
Create a new order from a users checkout, this just creates the order and payment, subsequent order transitions are managed via Stripe webhooks
*/
async function createOrder(args) {
  let context = {};

  try {
    // create the order from the users cart
    const order = factory.createOrderFromCart({
      ...args,
      shippingMethods: await shipping.getShippingOptions(),
    });

    // transition to Pending
    context = await stateMachine.transition({
      ...args.context,
      order,
      status: ORDER_STATUS.Pending,
      user: args.user,
      items: order.items,
    });

    if (context.payment) {
      return {
        orderId: context.order.id,
        code: context.order.code,
        clientSecret: context.payment.client_secret,
        paymentIntentId: context.payment.id,
        status: context.payment.complete ? 'success' : 'action', // action means we need to do 3DS for this payment
        token: context.payment.issueAuthToken ? jwt.issue(raven.utils.clone(args.user)) : null,
      };
    }

    return {
      orderId: context.order.id,
      code: context.order.code,
      status: 'success',
    };
  } catch (e) {
    await handleError(e, context.payment, context.order, true, 'CreateOrderError', args.context.request);

    throw Boom.boomify(e, {
      statusCode: 400,
      decorate: {
        token: context.payment && context.payment.issueAuthToken ? jwt.issue(raven.utils.clone(args.user)) : null,
      },
    });
  }
}

/*
Action to complete an order once we've had confirmation of payment from Stripe, this will be called from the Stripe webhooks controller
*/
async function completeOrder(args) {
  const { payment } = args;
  let order = null;

  try {
    // load order
    order = await args.context.session.database.include('userId').load(args.orderId);

    if (!order) throw Boom.badRequest('COMMON_NOT_FOUND', ['Order', args.orderId]);

    // if payment is complete and we've not already authorised the payment then delete cart, create barcodes and subscriptions etc
    if (payment.complete && !stateMachine.hasPaymentBeenTaken(order.status)) {
      // transition the order to payment taken
      await stateMachine.transition({
        ...args.context,
        order,
        status: payment.transitionTo,
        items: order.items,
        user: await args.context.session.database.load(order.userId),
        payment,
        params: {
          provider: args.provider,
        },
      });

      return { status: 'success' };
    }
    // if we get here we've already completed the order, so this is effectively a no-op
    return { status: 'noop' };
  } catch (e) {
    await handleError(e, payment, order, false, 'CompleteOrderError', args.request);

    return {
      status: 'error',
      message: config.production ? errordite.extractMessageFromError(e) : e.stack || errordite.extractMessageFromError(e),
    };
  }
}

/*
Triggered when the status of an order changes, this is internal, i.e. not invoked by Stripe, but usually via the admin system
progressing the order through its various states. itemIds refers to the items on the order that have changed status, up to this
point all state changes have occured at the item level (during checkout / payment flow), statusUpdate function however must
operate at the item level as we may ship, cancel or return individual items on the order
*/
async function statusUpdate(args) {
  let context = {};

  try {
    const order = await args.context.session.get(
      raven.Models.Order.getId(args.id),
      {
        user: 'userId',
        refund: 'refundId',
      },
      true,
    );

    if (!order) throw Boom.notFound('COMMON_NOT_FOUND', ['Order', args.id]);

    const items = !args.items || args.allItems ? order.items : order.items.filter((i) => args.items.includes(i.id));

    context = await stateMachine.transition({
      ...args.context,
      order,
      status: args.status,
      items,
      user: await args.context.session.get(order.userId),
      params: {
        provider: args.provider,
        fields: args.fields,
      },
    });

    return {
      success: true,
      order: context.order,
      user: context.user,
      refund: context.refund || order.refundId ? await args.context.session.get(order.refundId) : null,
    };
  } catch (err) {
    err.name = 'StatusChange';
    err.context = {
      orderId: args.id,
      status: args.status,
      itemIds: args.items,
    };
    throw err;
  }
}

async function failOrder(args) {
  try {
    const order = await args.context.session.database.include('userId').load(raven.Models.Order.getId(args.orderId));

    // no-op if order is null or the order is already at one of our failure statuses
    // (cancelled or payment failed) essentially makes the API idempotent
    if (!order || stateMachine.hasPaymentFailed(order.status)) return { success: true };

    // transition the order to the failed or cancelled status
    await stateMachine.transition({
      ...args.context,
      order,
      status: ORDER_STATUS.PaymentFailed,
      items: order.items,
      user: await args.context.session.database.load(order.userId),
      payment: args.payment,
      params: {
        provider: args.provider,
      },
    });

    return { success: true };
  } catch (err) {
    err.name = 'PaymentFailedError';
    err.context = {
      orderId: args.orderId,
      paymentId: args.payment.id,
    };

    errordite.log(err, args.request);

    return {
      success: false,
      message: config.production ? errordite.extractMessageFromError(err) : err.stack || errordite.extractMessageFromError(err),
    };
  }
}

async function handleError(e, payment, order, cancelPayment, name, request) {
  if (payment && payment.id && cancelPayment) {
    await tryExecuteAsync(() => payments.cancel(payment), true, false, {
      paymentId: payment.id,
      userId: order.userId,
      orderId: order.id,
    });
  }

  e.name = name;
  e.context = {
    paymentIntentId: payment && payment.id ? payment.id : null,
    userId: order ? order.userId : null,
    orderId: order ? order.id : null,
    paymentMethodId: payment && payment.paymentMethodId ? payment.paymentMethodId : null,
  };

  errordite.log(e, request);
}

async function hardDelete(context, id) {
  const order = await context.session.get(raven.Models.Order.getId(id));

  if (order) {
    const subscriptions = await context.session.subscriptions({ orderId: order.id }).all();
    const consultations = await context.session.consultations({ orders: order.id }).all();
    const credits = await context.session.credits({ orderId: order.id }).all();

    await Promise.all(consultations.map((o) => context.session.delete(o)));
    await Promise.all(subscriptions.map((e) => context.session.delete(e)));
    await Promise.all(credits.map((e) => context.session.delete(e)));

    await context.session.delete(raven.Models.Refund.getId(order.id));
    await context.session.delete(order);
  }
}

module.exports = {
  hardDelete,
  failOrder,
  completeOrder,
  get,
  query,
  createOrder,
  statusUpdate,
  addComment,
};
