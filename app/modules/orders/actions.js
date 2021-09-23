const moment = require('moment');
const Boom = require('@hapi/boom');
const payments = require('../payments');
const inventory = require('../inventory');
const security = require('../../utils/security');
const shipping = require('../shipping');
const notifications = require('../notifications');
const refunds = require('./refunds');
const raven = require('../ravendb');
const { PAYMENT_PROVIDERS, NOTIFICATIONS } = require('../../constants');

/*
This module is a place to define all actions we need to perform as part of an order state transition,
for example when an order transitions to Shipped we need to take payment.

These actions are configured on the relevant transition object in the stateMachine module

Ideally the actual business logic for each action should reside in the relevant module not in this module

See comments in stateMachine for properties of context, all action method signatures must accept a single argument called context
*/

const cashPaymentNotification = async (context) => {
  const cash = context.order.payments.find((p) => p.provider === PAYMENT_PROVIDERS.Cash);

  if (cash) {
    notifications.queue(context.user, NOTIFICATIONS.CashPaymentMethods, {
      session: context.session,
      code: context.order.code,
      amount: cash.amount,
    });
  }
};

const deleteCart = async (context) => {
  const id = context.cartId || context.order.cartId;

  // nothing to delete if the cart is transient
  if (id === 'transient') return;

  context.session.addCommitAction(async () => {
    await raven.execute(async (session) => {
      const cart = await session.get(raven.Models.Cart.getId(id));
      if (cart) await session.database.delete(cart);
    });
  });
};

const setPaymentTransactionId = (context) => {
  const payment = context.order.payments.find((p) => p.provider === PAYMENT_PROVIDERS.Cash);
  if (payment && context.params.fields) {
    payment.transactionId = context.params.fields.find((f) => f.field === 'transactionId').value;
  }
};

const validatePaymentProvider = (context) => {
  if (context.order.payments.every((p) => p.provider === PAYMENT_PROVIDERS.Credits)) return;

  const payment = context.order.payments.find((p) => p.provider === context.params.provider);

  if (!payment) {
    throw Boom.badRequest('ORDERS_INVALID_PAYMENT', ['Order', context.order.id]);
  }
};

const createPayment = async (context) => {
  await payments.create(context);
  if (!context.subscription) {
    if ((context.payment && context.payment.deleteCart) || !context.payment) await deleteCart(context);
  }
};

const cancelPayment = async (context) => {
  await payments.cancel(context);
};

const conditionalCancelPayment = async (context) => {
  await payments.conditionalCancel(context);
};

const capturePayment = async (context) => {
  await payments.capture(context);
};

const addItemsToRefund = async (context) => {
  context.refund = await refunds.addItems(context);
};

const deductStock = async (context) => {
  await inventory.deduct(context);
};

const releaseStock = async (context) => {
  await inventory.release(context);
};

const createShipment = async (context) => {
  await shipping.createShipment(context);
};

const storeOrder = async (context) => {
  await context.session.store(context.order);

  // update the items so we have the database items with Ids
  context.items = context.order.items;
  context.order.code = security.encodeOrderId(raven.utils.friendlyId(context.order.id));

  if (context.subscription) {
    context.subscription.nextDueAt = moment(context.subscription.nextDueAt).add(context.subscription.frequencyInDays, 'd').toDate();

    context.subscription.reminderSent = false;
    context.subscription.nextAttemptAt = null;
    context.subscription.failureCount = 0;
    context.subscription.failureReason = null;
    context.subscription.lastOrderAt = new Date().toISOString();
  }
};

module.exports = {
  storeOrder,
  capturePayment,
  createPayment,
  cancelPayment,
  conditionalCancelPayment,
  addItemsToRefund,
  deleteCart,
  deductStock,
  releaseStock,
  createShipment,
  validatePaymentProvider,
  setPaymentTransactionId,
  cashPaymentNotification,
};
