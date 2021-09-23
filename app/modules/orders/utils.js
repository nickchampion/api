const _ = require('lodash');
const R = require('ramda');
const math = require('../../utils/math');
const { ORDER_STATUS } = require('../../constants');

const groupedDiscounts = (itemDiscounts, cartDiscounts) => {
  // map and flatten the item discounts so the array structure matches the cartDiscounts structure
  const items = R.compose(
    R.flatten, // flatten into single dimensional array
    R.map((v) => v.discounts.applied),
  )(itemDiscounts);

  return R.compose(
    R.groupBy((d) => d.type),
    R.concat, // combine both discount arrays
  )(items, cartDiscounts.applied);
};

const calculateTotals = (context, order, out = {}) => {
  const grouped = groupedDiscounts(order.items, order.discounts);

  out.discounts = Object.keys(grouped).map((k) => {
    return {
      type: k,
      amount: context.utils.formatCurrency(math.round(R.sum(grouped[k].map((a) => a.total)))),
    };
  });

  if (order.payments.every((p) => p.capturedAt)) {
    out.paymentDue = context.utils.formatCurrency(math.round(_.sum(order.payments.map((p) => p.captureAmount))));
    out.cancelledTotal = context.utils.formatCurrency(math.round(order.orderTotal - out.paymentDue));
  } else {
    out.cancelledTotal = order.items.every((i) => i.status === ORDER_STATUS.Cancelled)
      ? context.utils.formatCurrency(order.orderTotal)
      : context.utils.formatCurrency(math.round(_.sum(order.items.filter((i) => i.status === ORDER_STATUS.Cancelled).map((i) => i.salePrice))));
    out.paymentDue = math.round(order.orderTotal - out.cancelledTotal);
  }

  out.itemTotal = context.utils.formatCurrency(math.round(_.sum(order.items.map((i) => i.price))));
  out.subTotal = context.utils.formatCurrency(math.round(order.subTotal + order.shippingTotal));

  return out;
};

module.exports = {
  calculateTotals,
};
