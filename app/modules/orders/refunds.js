const _ = require('lodash');
const Boom = require('@hapi/boom');
const raven = require('../ravendb');
const payments = require('../payments');
const map = require('../map');
const math = require('../../utils/math');
const { REFUND_STATUS, ORDER_STATUS } = require('../../constants');

async function get(context, userId) {
  const refund = await context.session.get(raven.Models.Refund.getId(context.params.id), {
    user: 'userId',
    order: 'orderId',
  });

  if (!refund || (userId && refund.userId !== userId)) throw Boom.notFound('COMMON_MODEL_NOT_FOUND', ['Refund', context.params.id]);

  return map.refund(context, refund);
}

async function query(context) {
  context.query.orderBy = '-createdAt';

  const refunds = await context.session.search(raven.Models.Refund, {
    user: 'userId',
    order: 'orderId',
  });

  return map.refunds(context, refunds);
}

async function statusUpdate(args) {
  const order = await args.context.session.get(
    raven.Models.Order.getId(args.id),
    {
      user: 'userId',
      refund: 'refundId',
    },
    true,
  );

  return payments.refund({
    order,
    refund: await args.context.session.get(order.refundId),
    user: await args.context.session.get(order.userId),
    transactionId: args.fields.find((f) => f.field === 'transactionId') ? args.fields.find((f) => f.field === 'transactionId').value : null,
    credits: args.fields.find((f) => f.field === 'credits') && args.fields.find((f) => f.field === 'credits').value === 'true',
    session: args.context.session,
  });
}

async function addItems(context) {
  // first check if we need to actually refund, if the items have not been paid for yet we can cancel without refunding
  if (context.order.payments.every((p) => !p.capturedAt)) return null;

  const refund = await getOrCreateRefund(context);

  // remove any unpaid payments as we'll calculate them again
  refund.payments = refund.payments.filter((p) => p.status === REFUND_STATUS.Paid);

  // add the newly cancelled items to the refund
  context.items.forEach((item) => {
    const existingItem = refund.items.find((i) => i.id === item.id);

    if (existingItem) throw Boom.badRequest(`Cannot refund the same item twice; item id: ${existingItem.id}`);

    refund.items.push({
      id: item.id,
      amount: item.salePrice,
      status: REFUND_STATUS.Pending,
    });
  });

  // add shipping and consultation fee if we've cancelled all items
  if (shouldRefundShipping(context)) {
    if (context.order.shippingTotal > 0) {
      refund.items.push({
        id: 'shipping',
        amount: context.order.shippingTotal,
        status: REFUND_STATUS.Pending,
      });
    }
    if (context.order.consultationFee > 0) {
      refund.items.push({
        id: 'consultation',
        amount: context.order.consultationFee,
        status: REFUND_STATUS.Pending,
      });
    }
  }

  const addPayment = (provider, amount) => {
    refund.payments.push({
      provider,
      amount,
      status: REFUND_STATUS.Pending,
    });
  };

  // recalculate what we owe the customer
  const totals = calculateRefundTotals(refund, context.order);

  // now calculate payments, if we've only paid with one payment method its simple, but if we've used credits we refund credits first
  addPayment(context.order.payments[0].provider, totals.due);

  refund.status = refund.items.every((i) => i.status === REFUND_STATUS.Pending) ? REFUND_STATUS.Pending : REFUND_STATUS.PartiallyPaid;
  refund.total = totals.total;

  return refund;
}

function shouldRefundShipping(context) {
  if (context.status === ORDER_STATUS.Returned) return false;
  const currentItems = context.items.map((i) => i.id);
  return context.order.items.filter((i) => !currentItems.includes(i.id)).every((i) => i.status === ORDER_STATUS.Cancelled);
}

// #region Helpers
async function getOrCreateRefund(context) {
  let refund = await context.session.get(raven.Models.Refund.getId(context.order.id));

  if (!refund) {
    refund = new raven.Models.Refund({
      id: raven.Models.Refund.getId(context.order.id),
      userId: context.user.id,
      orderId: context.order.id,
      status: REFUND_STATUS.Pending,
      currency: context.order.currency,
      country: context.order.country,
      items: [],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await context.session.store(refund);
    context.order.refundId = refund.id;
  }

  return refund;
}

function calculateRefundTotals(refund, order) {
  const paymentDue = math.round(_.sum(order.payments.map((p) => p.captureAmount)));
  const refundTotal = math.round(_.sum(refund.items.map((i) => i.amount)));
  const remainder = refundTotal > paymentDue ? math.round(refundTotal - paymentDue) : 0;
  const total = math.round(refundTotal - remainder);
  const paid = math.round(_.sum(refund.items.filter((i) => i.status === REFUND_STATUS.Paid).map((i) => i.amount)));
  const due = math.round(total - paid);

  return {
    total,
    paid,
    due,
  };
}
// #endregion

module.exports = {
  get,
  query,
  addItems,
  statusUpdate,
};
