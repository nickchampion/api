const raven = require('../ravendb');

const audit = (source) => {
  return {
    id: raven.utils.friendlyId(source.id),
    userId: raven.utils.friendlyId(source.userId),
    orderId: raven.utils.friendlyId(source.orderId),
    orderCode: source.orderCode,
    adminUserId: source.adminUserId,
    createdAt: source.createdAt,
    eventCode: source.eventCode,
    message: source.message,
    success: source.success,
    data: source.data,
    error: source.error,
    referenceIds: source.referenceIds,
    html: source.html,
    email: source.email,
    subscriptionId: raven.utils.friendlyId(source.subscriptionId),
  };
};

const audits = (source) => {
  return source.map((i) => audit(i));
};

module.exports = {
  audit,
  audits,
};
