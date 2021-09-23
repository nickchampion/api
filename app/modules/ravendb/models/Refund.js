const Base = require('./Base');

class Refund extends Base {
  id
  userId = null
  currency = null
  country = null
  total = 0
  status = null
  orderId = null
  createdAt = null
  updatedAt = null
  payments = []
  items = []
  patch = null

  constructor(refund) {
    super('Refunds', 'Refunds');
    this.merge(this, refund);
  }

  getId(id) {
    return Refund.getId(id);
  }

  static getIndexName() {
    return 'Refunds';
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    const parts = id.split('/');

    if (parts.length === 3) return id;

    if (parts.length === 2 && id.toLowerCase().indexOf('orders/') > -1)
      return `${id}/refund`;

    return `orders/${id}/refund`;
  }
}

module.exports = Refund;
