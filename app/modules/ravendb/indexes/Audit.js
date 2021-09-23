/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Audit extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Audits', (audit) => ({
      userId: audit.userId,
      orderId: audit.orderId,
      orderCode: audit.orderCode,
      adminUserId: audit.adminUserId,
      createdAt: audit.createdAt,
      success: audit.success,
      referenceIds: audit.referenceIds,
      subscriptionId: audit.subscriptionId,
      eventCode: audit.eventCode,
      email: audit.email,
      query: [id(audit).split('/')[1], audit.userId, audit.orderId, audit.orderCode, audit.adminUserId, audit.eventCode],
      patch: audit.patch,
    }));

    this.index('query', 'Search');
  }
}

module.exports = new Audit();
