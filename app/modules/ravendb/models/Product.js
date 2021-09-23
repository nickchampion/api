const Base = require('./Base');

class Product extends Base {
  id
  name = null
  description = null
  slug = null
  merchantId = null
  merchantSkuId = null
  price = null
  currency = null
  status = null
  departmentId = null
  categories = null
  taxonomy = null
  variants = []
  images = null
  type = null
  createdAt = null
  updatedAt = null
  patch = null

  constructor(product) {
    super('Products', 'products');
    this.merge(this, product);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `products/${id}` : id;
  }

  static getIndexName() {
    return 'Products';
  }
}

module.exports = Product;
