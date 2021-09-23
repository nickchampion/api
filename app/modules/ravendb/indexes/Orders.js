/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Orders extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    const { load } = this.mapUtils();
    this.map('Orders', (order) => {
      const user = load(order.userId, 'Users');
      const bundleProductIds = order.items.filter((i) => i.type === 'Bundle').flatMap((i) => i.metadata.contents.map((c) => c.skuId));
      const productIds = order.items.filter((i) => i.type !== 'Bundle').map((i) => i.skuId);
      const shippedAt = order.shipments.map((i) => i.createdAt).sort((a, b) => b - a);

      return {
        userId: order.userId,
        merchantId: order.merchantId,
        sellerId: order.sellerId,
        eventId: order.eventId,
        status: order.status,
        code: order.code,
        discountCode: order.discountCode,
        country: order.country,
        shippingMethodId: order.shippingMethodId,
        shippingType: order.shippingType,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: order.createdAt,
        items: order.items.map((i) => i.type),
        statuses: order.items.map((i) => i.status),
        products: bundleProductIds.concat(productIds),
        discounts: order.discounts.ids.map((c) => c.id),
        shippedAt: shippedAt.length === 0 ? null : shippedAt[0],
        payments: order.payments.map((p) => p.provider),
        query: [
          order.status,
          order.code,
          user.id.split('/')[1],
          user.firstName,
          user.lastName,
          user.phone,
          order.country,
          order.discountCode,
          user.email,
          id(order).split('/')[1],
        ],
        patch: order.patch,
      };
    });
    this.index('query', 'Search');
  }
}

module.exports = new Orders();
