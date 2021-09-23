const futils = require('../../../utils/futils.js');
const math = require('../../../utils/math.js');
const { DISCOUNT_TYPES } = require('../../../constants');

const apply = (cartContext) => {
  const country = cartContext.discount.countries.find((c) => c.country === cartContext.user.country);

  // calculate teh new order total first
  const orderTotalAfterDiscount = math.round(cartContext.cart.orderTotal - country.fixedAmount);

  // if its < 0 adjust the discount amount applied to be the order total, makes the order free, otherwise use the full discount amount
  const discountAmount = orderTotalAfterDiscount > 0 ? country.fixedAmount : cartContext.cart.orderTotal;

  return futils.modify(cartContext, ['cart'], (ctx) => {
    ctx.cart.discounts.applied.push({
      type: DISCOUNT_TYPES.FixedCartAmount,
      code: cartContext.discount.code,
      total: discountAmount,
      id: cartContext.discount.id,
      changeVector: cartContext.discount.changeVector,
      description: country.description,
    });
    return ctx;
  });
};

module.exports = {
  cart: true,
  apply,
};
