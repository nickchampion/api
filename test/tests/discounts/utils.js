const pipeline = require('../../../app/modules/cart/pipeline');
const data = require('../../data');

const createCartContext = async (cart, discount) => {
  const user = data.user();
  return {
    context: {
      user,
      country: 'SG',
    },
    cart: Object.freeze(pipeline.resetCart(cart)),
    originalCart: cart,
    plans: Object.freeze(data.subscriptions().plans),
    categories: Object.freeze(data.categories()),
    addresses: [],
    cards: [],
    shipping: Object.freeze(data.shipping().methods.find((s) => s.country === 'SG')),
    discount: discount ? Object.freeze(discount) : null,
    user: Object.freeze(user),
    validation: {
      discount: {
        valid: true,
        code: null,
      },
      credits: {
        valid: true,
        code: null,
      },
    },
  };
};

module.exports = {
  createCartContext,
};
