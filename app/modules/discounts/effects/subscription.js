const F = require('../utils');
const futils = require('../../../utils/futils');
const math = require('../../../utils/math');
const config = require('../../configuration').config();
const { DISCOUNT_TYPES } = require('../../../constants');

const apply = (cartContext) => {
  const plan = cartContext.item.planId === null ? null : cartContext.plans.find((p) => p.id === cartContext.item.planId);

  if (plan != null && plan.percentOff > 0 && config.subscriptions.enabled) {
    // subscriptions always get calculated off thge list price before any other discounts are applied
    // otherwise the prices we show in the UI will be incorrect
    const discountAmount = F.roundPercentage(cartContext.item.price, plan.percentOff);

    return futils.modify(cartContext, ['item'], (ctx) => {
      ctx.item.discounts.applied.push({
        type: DISCOUNT_TYPES.Subscription,
        amount: discountAmount,
        total: math.round(discountAmount * cartContext.item.quantity),
      });
      return ctx;
    });
  }

  return cartContext;
};

module.exports = {
  cart: false,
  apply,
};
