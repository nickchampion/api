const Base = require('./Base');

class Merchant extends Base {
  id
  name = null
  createdAt = null
  updatedAt = null
  patch = null

  constructor(merchant) {
    super('Merchants', 'merchants');
    this.merge(this, merchant);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    // caters for custom packs which don't have a database identifier
    if(id.indexOf('-') === -1)
      return id.indexOf('/') === -1 ? id : id.split('/')[1];

    return id.indexOf('/') === -1 ? `merchants/${id}` : id;
  }

  static getIndexName() {
    return 'Merchants';
  }
}

module.exports = Merchant;
