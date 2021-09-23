const _ = require('lodash');
const math = require('../../utils/math');
const raven = require('../ravendb');
const urls = require('../../utils/urls');
const futils = require('../../utils/futils.js');

const initialise = (cartContext) => {
  return futils.modify(cartContext, ['cart'], (ctx) => {
    let id = 1;
    ctx.cart.items.forEach((item) => {
      item.id = id;
      id += 1;
    });

    if (cartContext.context.user) {
      ctx.cart.country = cartContext.context.user.country;
      ctx.cart.userId = cartContext.context.user.id;
    }

    return ctx;
  });
};

const finalise = (cartContext) => {
  // copy any changes we've made to the cart in the pipeline back to the original cart which is the raven DB cart entity
  // this ensures we update the database correctly due to the way RavenDB tracks entities during a session
  raven.utils.copy(cartContext.cart, cartContext.originalCart);

  // update cart timestamp
  cartContext.originalCart.updatedAt = new Date().toISOString();

  // clean up some items from cart we used for the pipeline, dont want them stored in DB
  cartContext.originalCart.items.forEach((item) => {
    delete item.valid;
  });

  // finally add extra fields we need for the API response these fields DO NOT get persisted to the database
  return futils.modify(cartContext, ['cart'], (ctx) => {
    delete ctx.cart['@metadata'];

    ctx.cart.id = raven.utils.friendlyId(ctx.cart.id);
    ctx.cart.userId = raven.utils.friendlyId(ctx.cart.userId);
    ctx.cart.addresses = cartContext.addresses;
    ctx.cart.cards = cartContext.cards;
    ctx.cart.amountPayable = math.round(cartContext.cart.orderTotal - cartContext.cart.credits.spent);
    ctx.cart.paymentOptions = cartContext.paymentOptions;
    ctx.cart.shippingOptions = cartContext.shippingOptions;
    ctx.cart.shippingThreshold = cartContext.shippingOptions.find((s) => !s.collection).threshold;
    ctx.cart.zesttee = cartContext.zesttee;

    ctx.cart.items.forEach((item) => {
      item.url = urls.product(item, ctx.categories);
      item.plan = ctx.plans.find((p) => p.id === item.planId);
    });

    ctx.cart.items = _.orderBy(ctx.cart.items, ['type', 'name'], ['asc', 'asc']);
    return ctx;
  });
};

const calculateTotalBeforeShipping = (cartContext) => {
  cartContext.cart.orderTotal = Math.max(
    math.round(cartContext.cart.subTotal + cartContext.cart.consultationFee - cartContext.cart.discountTotal),
    0,
  );
  return cartContext;
};

const calculateTotal = (cartContext) => {
  cartContext.cart.orderTotal = Math.max(
    math.round(cartContext.cart.subTotal + cartContext.cart.consultationFee + cartContext.cart.shippingTotal - cartContext.cart.discountTotal),
    0,
  );
  return cartContext;
};

module.exports = {
  initialise,
  finalise,
  calculateTotalBeforeShipping,
  calculateTotal,
};
