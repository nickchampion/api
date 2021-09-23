const { SINGLETONS } = require('../../constants');

class ShippingController {
  async get(request) {
    const shipping = await request.context.session.get(SINGLETONS.Shipping);
    return {
      results: shipping.methods,
      total: shipping.methods.length,
    };
  }
}

module.exports = ShippingController;
