const RavenController = require('../RavenController');
const map = require('../../modules/map');
const raven = require('../../modules/ravendb');
const pricing = require('../../modules/pricing');
const cache = require('../../modules/cache');

class ProductController extends RavenController {
  constructor() {
    super(raven.Models.Product, raven.Indexes.Products, map.adminProduct, map.adminProducts);
  }

  async clone(request) {
    const product = await request.context.session.get(raven.Models.Product.getId(request.context.params.id));

    if (product) {
      await request.context.session.database.advanced.evict(product);

      delete product.id;
      delete product['@metadata'];
      delete product.productId;

      product.externalId = null;

      const clone = new raven.Models.Product(product);
      await request.context.session.database.store(clone);

      return {
        id: clone.id,
      };
    }

    return {
      id: 'not found',
    };
  }

  async beforeCreate(doc) {
    doc.updatedAt = new Date().toISOString();
    doc.createdAt = new Date().toISOString();

    await this.convertPrices(doc);
  }

  async beforePatch(patch, doc) {
    patch.updatedAt = new Date().toISOString();
    patch.inventoryUpdatedAt = new Date().toISOString();

    await this.convertPrices(doc);

    if (!doc.prices && !doc.isActive && patch.prices && (doc.images || patch.images)) patch.isActive = true;
  }

  async afterPatch() {
    cache.deleteByPrefix('products');
  }

  async convertPrices(doc) {
    if (doc.variants && doc.variants.length > 0) {
      const promises = doc.variants.map(async (v) => {
        await pricing.convert(v.prices);
      });

      await Promise.all(promises);
    } else {
      await pricing.convert(doc.prices);
    }
  }
}

module.exports = ProductController;
