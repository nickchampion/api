const Base = require('./Base');

class Bundle extends Base {
  id
  name = null
  prices = {}
  sellerId = null
  status = null
  image = null
  slug = null
  categoryIds = []
  contents = null
  createdAt = null
  updatedAt = null
  patch = null

  constructor(bundle) {
    super('Bundles', 'bundles');
    this.merge(this, bundle);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    // caters for custom packs which don't have a database identifier
    if(id.indexOf('-') === -1)
      return id.indexOf('/') === -1 ? id : id.split('/')[1];

    return id.indexOf('/') === -1 ? `bundles/${id}` : id;
  }

  static getIndexName() {
    return 'Bundles';
  }
}

module.exports = Bundle;
