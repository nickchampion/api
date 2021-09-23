const F = require('../utils');
const futils = require('../../../utils/futils.js');
const math = require('../../../utils/math.js');
const { DISCOUNT_TYPES } = require('../../../constants');

const apply = (cartContext) => {
  if (!cartContext.item.valid) return cartContext;

  const country = cartContext.discount.countries.find((c) => c.country === cartContext.user.country);
  // calculate the price for a single quantity after previous discounts have been applied
  const saleItemPrice = F.calculateSingleQtySalePrice(cartContext.item);
  // calculate the discount based on the single item sale price
  const discountAmount = F.roundPercentage(saleItemPrice, country.percentage);
  // support limiting this discount to only be applicable to a limited quantity
  const quantityApplicable = cartContext.discount.restrictions.maxQuantity
    ? Math.min(cartContext.item.quantity, cartContext.discount.restrictions.maxQuantity)
    : cartContext.item.quantity;

  return futils.modify(cartContext, ['item'], (ctx) => {
    ctx.item.discounts.applied.push({
      type: DISCOUNT_TYPES.Percentage,
      code: cartContext.discount.code,
      amount: discountAmount,
      total: math.round(discountAmount * quantityApplicable),
      id: cartContext.discount.id,
      changeVector: cartContext.discount.changeVector,
      description: country.description,
    });
    return ctx;
  });
};

module.exports = {
  cart: false,
  apply,
};
