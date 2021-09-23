const Base = require('./Base');

class Discount extends Base {
  id
  code = null
  effect = null
  status = null
  tags = []
  countries = []
  startsAt = null
  endsAt = null
  usageCount = null 
  usageCountPerUser = null
  createdAt = null
  updatedAt = null
  updatedByUserId = null
  affiliate = null
  restrictions = {}
  patch = null

  constructor(discount) {
    super('Discounts', 'discounts');
    this.merge(this, discount);
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `discounts/${id}` : id;
  }

  static getIndexName() {
    return 'Discounts';
  }
}

module.exports = Discount;
