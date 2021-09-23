const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Carts extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Carts', (cart) => {
      const bundleProductIds = cart.items.filter((i) => i.packId !== null).map((i) => i.metadata.contents.map((c) => c.id));
      const productIds = cart.items.filter((i) => (i.packId !== null ? i.packId : i.productId !== null ? i.productId : i.medicationId));
      return {
        userId: cart.userId,
        total: cart.orderTotal,
        subTotal: cart.subTotal,
        country: cart.country,
        multi: cart.items.Any((i) => i.quantity > 1),
        items: cart.items.Select((i) => i.type),
        products: bundleProductIds.concat(productIds),
        updatedAt: cart.updatedAt,
        count: cart.items.Count(),
        sendCount: cart.sendCount,
        sentReminderAt: cart.sentReminderAt,
        token: cart.token,
        patch: cart.patch,
      };
    });
  }
}

module.exports = new Carts();
