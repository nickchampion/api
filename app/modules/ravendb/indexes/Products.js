/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Products extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Products', (product) => ({
      status: product.status,
      merchantId: product.merchantId,
      merchantSkuId: product.merchantSkuId,
      slug: product.slug,
      departmentId: product.departmentId,
      categories: product.categories,
      type: product.type,
      query: [product.slug, product.type, product.departmentId, product.categoryId, id(product).split('/')[1]],
      patch: product.patch,
    }));

    this.index('query', 'Search');
  }
}

module.exports = new Products();
