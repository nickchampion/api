/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Refunds extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    const { load } = this.mapUtils();
    this.map('Refunds', (refund) => {
      const user = load(refund.userId, 'Users');
      const order = load(refund.orderId, 'Orders');

      return {
        userId: refund.userId,
        status: refund.status,
        orderId: refund.orderId,
        code: order.code,
        country: user.country,
        email: user.email,
        createdAt: refund.createdAt,
        query: [
          id(refund).split('/')[1],
          refund.status,
          refund.orderId.split('/')[1],
          refund.userId.split('/')[1],
          user.email,
          order.code,
          user.country,
        ],
        patch: refund.patch,
      };
    });
    this.index('query', 'Search');
  }
}

module.exports = new Refunds();
