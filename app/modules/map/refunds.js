const raven = require('../ravendb');
const { REFUND_STATUS } = require('../../constants');

const refund = (context, source) => {
  context.utils.setCountry(source.country);
  return {
    id: raven.utils.friendlyId(source.id),
    userId: raven.utils.friendlyId(source.userId),
    orderId: raven.utils.friendlyId(source.orderId),
    code: source.order.code,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    total: context.utils.formatCurrency(source.total),
    status: source.status,
    currency: source.currency,
    country: source.country,
    user: {
      id: raven.utils.friendlyId(source.user.id),
      fullName: `${source.user.firstName} ${source.user.lastName}`,
      email: source.user.email,
    },
    items: source.items.map((i) => {
      const orderItem = source.order.items.find((it) => it.id === i.id);
      return {
        id: i.id,
        amount: context.utils.formatCurrency(i.salePrice),
        status: REFUND_STATUS.Pending,
        name: orderItem.name,
        orderStatus: orderItem.status,
      };
    }),
  };
};

const refunds = async (context, source) => {
  if (source.results) {
    source.results = source.results.map((r) => refund(r));
    return source;
  }

  return source.results.map((r) => refund(r));
};

module.exports = {
  refund,
  refunds,
};
