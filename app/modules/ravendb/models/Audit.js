const Base = require('./Base');

class Audit extends Base {
  id
  userId = null
  orderId = null
  orderCode = null
  adminUserId = null
  createdAt = null
  eventCode = null
  message = null
  success = true
  data = null
  error = null
  referenceIds = []
  html = null
  email = null
  subscriptionId = null
  patch = null

  constructor(audit) {
    super('Audit', 'audits');
    this.merge(this, audit);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `audits/${id}` : id;
  }

  static getIndexName() {
    return 'Audit';
  }
}

module.exports = Audit;
