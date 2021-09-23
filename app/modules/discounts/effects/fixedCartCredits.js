const futils = require('../../../utils/futils.js');
const { DISCOUNT_TYPES } = require('../../../constants');
const config = require('../../configuration').config();

const apply = (cartContext) => {
  const country = cartContext.discount.countries.find((c) => c.country === cartContext.user.country);

  return futils.modify(cartContext, ['cart'], (ctx) => {
    ctx.cart.discounts.applied.push({
      type: DISCOUNT_TYPES.Credit,
      code: cartContext.discount.code,
      amount: 0,
      total: 0,
      credits: country.fixedAmount,
      id: cartContext.discount.id,
      changeVector: cartContext.discount.changeVector,
      description: country.description,
      creditsExpiryDays: country.creditsExpiryDays || config.credits.defaultExpiryDays,
    });
    return ctx;
  });
};

module.exports = {
  cart: true,
  apply,
};
