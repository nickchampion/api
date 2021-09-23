const Boom = require('@hapi/boom');
const _ = require('lodash');
const orders = require('../orders');
const addresses = require('../addresses');
const payments = require('../payments');
const raven = require('../ravendb');
const map = require('../map');
const cache = require('../cache');
const pipeline = require('./pipeline');
const validation = require('./validation');
const shared = require('./shared');
const { getCartToken } = require('../../utils/crypto');
const { PRODUCT_TYPES, PAYMENT_PROVIDERS } = require('../../constants');

async function getCart(context) {
  if (!context.headers.cart) return null;

  const cart = await shared.getSingleCartForUser(context);

  if (cart) {
    const originalCartTotal = cart.orderTotal;
    const c = await executeCartPipeline(context, cart);

    // if the pipeline has changed save the cart
    if (c.cart.orderTotal !== originalCartTotal) {
      context.session.commitOnGet = true;
    }

    return map.formatCartPrices(context, c.cart);
  }

  return {
    cart: map.formatCartPrices(context, createCart(context, context.headers.cart)),
    cards: [],
    addresses: [],
  };
}

function createCart(context, token, id) {
  return {
    id,
    token,
    currency: context.country.currency,
    orderTotal: 0,
    discountTotal: 0,
    shippingTotal: 0,
    amountPayable: 0,
    shippingThreshold: 0,
    subTotal: 0,
    country: context.user ? context.user.country : context.country.isoCode,
    userId: context.user ? context.user.id : null,
    items: [],
    discounts: {
      total: 0,
      applied: [],
    },
    discountCode: null,
    shippingMethodId: null,
    paymentProvider: context.payload && context.payload.paymentProvider ? context.payload.paymentProvider : PAYMENT_PROVIDERS.Stripe,
    sendCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function getCartItems(context) {
  if (!context.headers.cart) return null;
  const cart = await shared.getSingleCartForUser(context);
  return cart ? cart.items : [];
}

async function addItems(context) {
  const token = context.headers.cart;

  const productIds = _.compact(
    context.payload.items
      .filter((i) => i.productId)
      .map((e) => {
        return {
          id: raven.Models.Product.getId(e.productId),
          qty: e.quantity,
          variantId: e.variantId || null,
        };
      }),
  );

  const bundleIds = _.compact(
    context.payload.items
      .filter((i) => i.bundleId)
      .map((e) => {
        return {
          id: raven.Models.Bundle.getId(e.bundleId),
          qty: e.quantity,
        };
      }),
  );

  const products =
    productIds.length > 0
      ? await context.session
          .products()
          .whereIn(
            'id',
            productIds.map((p) => p.id),
          )
          .all()
      : [];

  const bundles =
    bundleIds.length > 0
      ? await context.session
          .bundles()
          .whereIn(
            'id',
            bundleIds.map((p) => p.id),
          )
          .all()
      : [];

  if (products.length === 0 && bundles.length === 0) throw Boom.badRequest('CART_ITEMS_NOT_FOUND');

  const productCartItems = map.cartProducts(context, products, productIds);
  const bundleCartItems = map.cartBundles(context, bundles, bundleIds);

  return updateCart(context, token, [...productCartItems, ...bundleCartItems]);
}

async function setItemQuantity(context) {
  const token = context.headers.cart;
  const cart = await shared.getSingleCartForUser(context);

  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', token]);

  const itemsToValidate = [];
  context.payload.items.forEach((item) => {
    const index = _.findIndex(cart.items, (e) => e.id === item.lineId);

    if (index > -1) {
      cart.items[index].quantity = item.quantity;
      itemsToValidate.push(cart.items[index]);
    }
  });

  return map.formatCartPrices(context, (await executeCartPipeline(context, cart)).cart);
}

async function deleteCart(context) {
  const cart = await shared.getSingleCartForUser(context);

  if (cart) await context.session.delete(cart);

  return {
    success: true,
  };
}

async function deleteCartItem(context) {
  const token = context.headers.cart;
  const cart = await shared.getSingleCartForUser(context);

  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', token]);

  cart.items = _.filter(cart.items, (e) => e.id !== context.params.id);
  return map.formatCartPrices(context, (await executeCartPipeline(context, cart)).cart);
}

async function attachDiscountCode(context) {
  const cart = await shared.getSingleCartForUser(context);
  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', context.headers.cart]);

  cart.discountCode = context.payload.code.toUpperCase();
  const result = await executeCartPipeline(context, cart);

  if (!result.validation.discount.valid) {
    throw Boom.badRequest(result.validation.discount.code);
  }

  return map.formatCartPrices(context, result.cart);
}

async function detachDiscountCode(context) {
  const cart = await shared.getSingleCartForUser(context);
  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', context.headers.cart]);

  cart.discountCode = null;
  return map.formatCartPrices(context, (await executeCartPipeline(context, cart)).cart);
}

async function setPaymentProvider(context) {
  const cart = await shared.getSingleCartForUser(context);
  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', context.headers.cart]);

  cart.paymentProvider = context.payload.provider;
  return map.formatCartPrices(context, (await executeCartPipeline(context, cart)).cart);
}

async function setShippingOption(context) {
  const cart = await shared.getSingleCartForUser(context);
  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', context.headers.cart]);

  cart.shippingMethodId = context.payload.id;
  return map.formatCartPrices(context, (await executeCartPipeline(context, cart)).cart);
}

async function checkout(context) {
  const [cart, user, userAddresses] = await Promise.all([
    shared.getSingleCartForUser(context),
    context.session.get(raven.Models.User.getId(context.user.id)),
    addresses.get(context.user.id),
  ]);

  if (!cart) throw Boom.badRequest('COMMON_NOT_FOUND', ['Cart', context.headers.cart]);
  if (!cart.items || cart.items.length === 0) throw Boom.badRequest('CART_EMPTY');
  if (!user) throw Boom.badRequest('COMMON_NOT_FOUND', ['User', context.user.id]);

  // perform some pre-checkout validation checks
  const validationResult = await validation.validate(context, cart, user);

  if (validationResult) {
    validationResult.cart = cart;
    return validationResult;
  }

  return this.createOrder({
    context,
    user,
    cart,
    addresses: userAddresses,
  });
}

async function createOrder(args) {
  // run the pipeline so everything is up to date before we try to checkout
  const originalCartTotal = args.cart.orderTotal;
  const freshCart = (await executeCartPipeline(args.context, args.cart)).cart;

  if (freshCart.orderTotal !== originalCartTotal && !args.context.builder) {
    // something changed so stop the checkout process, return the cart with a flag indicating to client we need to refresh the page
    return {
      cart: freshCart,
      refresh: true,
      message: args.context.localise('CHECKOUT_CART_CHANGED'),
    };
  }

  args.context.cartId = raven.Models.Cart.getId(args.cart.id);
  args.cart = freshCart;

  const result = await orders.createOrder(args);

  if (result.status === 'success') {
    cache.del(`cards:${args.user.id}`);
    cache.del(`${args.user.id}:credits`);
  }

  return result;
}

async function confirm(context) {
  const cart = await shared.getSingleCartForUser(context);

  if (cart) await context.session.database.delete(raven.Models.Cart.getId(cart.id));

  cache.del(`cards:${context.user.id}`);

  return {
    success: true,
  };
}

async function deleteCard(context) {
  await payments.deleteCard(context.params.id);
  return this.getCart(context);
}

// #region Internal Helpers

async function addCustomPack(context, token) {
  const products = await context.session
    .products()
    .whereIn('id', _.compact(context.payload.items.map((e) => raven.Models.Product.getId(e.productId))))
    .selectFields(['id', 'prices', 'productType'])
    .all();

  const item = map.cartCustomPack(context, products);

  return updateCart(context, token, [item]);
}

// Run the cart pipeline to apply discounts, shipping, fees etc and calculate totals
async function executeCartPipeline(context, cart) {
  // create the context before we run the pipeline all data loading etc happens here, the pipeline itself is synchronous
  const cartContext = await pipeline.createContext(context, cart);

  // execute the cart pipeline
  return pipeline.execute(cartContext);
}

async function updateCart(context, token, newItems) {
  // Try to generate new token here if toke is null or undenfined
  // eslint-disable-next-line no-param-reassign
  if (_.isNil(token)) token = getCartToken();

  let cart = await shared.getSingleCartForUser(context);

  if (!cart) {
    cart = new raven.Models.Cart(createCart(context, token));
    await context.session.store(cart);
  }

  cart.items = shared.mergeCartItem(cart.items, newItems);
  cart.appointmentId = context.payload.appointmentId || cart.appointmentId || null;

  return map.formatCartPrices(context, (await executeCartPipeline(context, cart)).cart);
}

// #endregion

module.exports = {
  deleteCard,
  confirm,
  createOrder,
  checkout,
  attachDiscountCode,
  detachDiscountCode,
  getCart,
  createCart,
  getCartItems,
  addItems,
  deleteCartItem,
  deleteCart,
  setItemQuantity,
  setPaymentProvider,
  setShippingOption,
};
