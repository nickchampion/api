const Base = require('./Base');

class Seller extends Base {
  id
  name = null
  createdAt = null
  updatedAt = null
  patch = null

  constructor(seller) {
    super('Sellers', 'sellers');
    this.merge(this, seller);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    // caters for custom packs which don't have a database identifier
    if(id.indexOf('-') === -1)
      return id.indexOf('/') === -1 ? id : id.split('/')[1];

    return id.indexOf('/') === -1 ? `sellers/${id}` : id;
  }

  static getIndexName() {
    return 'Sellers';
  }
}

module.exports = Seller;
