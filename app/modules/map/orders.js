const { ORDER_STATUS } = require('../../constants');
const urls = require('../../utils/urls');
const outils = require('../orders/utils');
const raven = require('../ravendb');

const friendlyOrderStatus = (status) => {
  switch (status) {
    case ORDER_STATUS.Pending:
      return 'Pending';
    case ORDER_STATUS.PendingFraudCheck:
      return 'Pending Fraud';
    case ORDER_STATUS.PaymentTaken:
      return 'Payment Taken';
    case ORDER_STATUS.PaymentFailed:
      return 'Payment Failed';
    case ORDER_STATUS.PaymentCaptured:
      return 'Payment Captured';
    case ORDER_STATUS.ReturnPending:
      return 'Return Pending';
    default:
      return status;
  }
};

const friendlyStatus = (status) => {
  switch (status) {
    case ORDER_STATUS.Pending:
    case ORDER_STATUS.PendingFraudCheck:
    case ORDER_STATUS.PaymentTaken:
    case ORDER_STATUS.PaymentCaptured:
      return 'Processing';
    case ORDER_STATUS.PaymentFailed:
      return 'Payment Failed';
    case ORDER_STATUS.ReturnPending:
      return 'Return Pending';
    default:
      return status;
  }
};

const determineOrderStatus = (order) => {
  const statuses = order.items.map((i) => i.status);

  // if all are the same just return the current status
  if (statuses.every((s) => s === statuses[0])) return friendlyOrderStatus(statuses[0]);

  if (statuses.some((s) => s === ORDER_STATUS.Delivered)) return 'Partially Delivered';

  if (statuses.some((s) => s === ORDER_STATUS.Shipped)) return 'Partially Shipped';

  if (statuses.some((s) => s === ORDER_STATUS.Returned)) return 'Partially Returned';

  if (statuses.some((s) => s === ORDER_STATUS.ReturnPending)) return 'Partially Return Pending';

  if (statuses.some((s) => s === ORDER_STATUS.Cancelled)) return 'Partially Cancelled';

  return friendlyOrderStatus(order.status);
};

const orderSummary = async (context, orders) => {
  orders.results = orders.results.map((o) => {
    // ensure we're using the right country / currency for formatting the order
    context.utils.setCountry(o.country);

    return {
      country: o.country,
      currency: o.currency,
      orderTotal: context.utils.formatCurrency(o.orderTotal),
      discountTotal: context.utils.formatCurrency(o.discountTotal),
      shippingType: o.shippingType,
      shippingMethodId: o.shippingMethodId,
      shippingTotal: context.utils.formatCurrency(o.shippingTotal),
      discountCode: o.discountCode,
      subTotal: context.utils.formatCurrency(o.subTotal),
      status: o.status,
      displayStatus: determineOrderStatus(o),
      code: o.code,
      id: raven.utils.friendlyId(o.id),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      payments: o.payments,
      user: {
        id: raven.utils.friendlyId(o.userId),
        fullName: `${o.user.firstName} ${o.user.lastName}`,
        email: o.user.email,
      },
    };
  });

  return orders;
};

const order = (context, source, categories) => {
  // ensure we're using the right country / currency for formatting the order
  context.utils.setCountry(source.country);

  const o = {
    id: raven.utils.friendlyId(source.id),
    code: source.code,
    userId: raven.utils.friendlyId(source.userId),
    shipping: source.shipping,
    billing: source.billing,
    country: source.country,
    currency: source.currency,
    orderTotal: context.utils.formatCurrency(source.orderTotal),
    discountTotal: context.utils.formatCurrency(source.discountTotal),
    shippingTotal: context.utils.formatCurrency(source.shippingTotal),
    shippingMethodId: source.shippingMethodId,
    deliveryInstructions: source.deliveryInstructions,
    shippingType: source.shippingType,
    discountCode: source.discountCode,
    subTotal: context.utils.formatCurrency(source.subTotal),
    status: source.status,
    displayStatus: determineOrderStatus(source),
    createdAt: source.createdAt,
    transitions: source.transitions,
    updatedAt: source.updatedAt,
    payments: source.payments,
    shippedAt: source.shipments.length > 0 ? source.shipments[0].createdAt : null,
    comments: source.comments,
  };

  o.items = source.items.map((item) => {
    const refundItem = source.refund ? source.refund.items.find((i) => i.id === item.id) : null;
    const i = {
      id: item.id,
      skuId: raven.utils.friendlyId(item.skuId),
      name: `${item.name}`,
      image: item.image,
      price: context.utils.formatCurrency(item.price),
      total: context.utils.formatCurrency(item.salePrice),
      subTotal: context.utils.formatCurrency(item.price),
      type: item.type,
      status: item.status,
      displayStatus: friendlyStatus(item.status),
      discountTotal: context.utils.formatCurrency(item.discounts.total),
      url: urls.product(item, categories),
      currency: source.currency,
      refund: refundItem,
      discounts: item.discounts,
    };

    i.discounts.total = context.utils.formatCurrency(item.discounts.total);
    i.discounts.applied.forEach((a) => {
      a.total = context.utils.formatCurrency(a.total);
    });
    return i;
  });

  o.payments.forEach((p) => {
    p.amount = context.utils.formatCurrency(p.amount);
  });

  if (source.user) {
    o.user = {
      id: raven.utils.friendlyId(source.user.id),
      firstName: source.user.firstName,
      lastName: source.user.lastName,
      email: source.user.email,
      phone: source.user.phone,
    };
  }

  if (source.refund) {
    o.refund = {
      id: source.refund.id,
      total: context.utils.formatCurrency(source.refund.total),
      status: source.refund.status,
      createdAt: source.refund.createdAt,
      payments: source.refund.payments,
    };
  }

  return outils.calculateTotals(context, source, o);
};

const orders = (context, source, categories, formatPrice = true) => {
  if (source.results) {
    source.results = source.results.map((o) => order(context, o, categories, formatPrice));
    return source;
  }

  return source.map((o) => order(context, o, categories, formatPrice));
};

module.exports = {
  orderSummary,
  orders,
  order,
  determineOrderStatus,
};
