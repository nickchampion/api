const R = require('ramda');
const _ = require('lodash');
const futils = require('../../utils/futils');
const zesttee = require('../../utils/zesttee');
const payments = require('../payments');
const taxonomy = require('../taxonomy');
const addresses = require('../addresses');
const shipping = require('../shipping');
const discountLoader = require('../discounts/loader');
const F = require('./utils');
const discounts = require('../discounts');
const { ORDER_STATUS, SINGLETONS, CASHBACK_ORDER_STATUS } = require('../../constants');

// execute the cart pipeline, functions execute left to right (top to bottom)
// Note that any changes made to cartContext.cart will be mapped back to the cart passed to this function
// this ensures the databse is updated correctly after the pipeline has run. The cart returned from
// this method however is a clone of the database cart with additional info set that we need for the
// client (cards, addresses etc) this happens in the finalise function which is run last
const execute = (cartContext) =>
  R.pipe(
    F.initialise,
    discounts.apply,
    F.calculateTotalBeforeShipping,
    F.calculateTotalBeforeShipping,
    shipping.apply,
    F.calculateTotal,
    F.finalise,
  )(cartContext);

const resetCart = (cart) => ({
  ..._.cloneDeep(cart),
  shippingTotal: 0,
  discounts: {
    total: 0,
    applied: [],
  },
  items: R.map((i) => {
    i.discounts = {
      total: 0,
      applied: [],
    };
    i.subTotal = i.price; // reset the subTotal
    i.total = i.price; // reset the total
    i.valid = true; // start off assuming all items are valid for the checkout, discount restrictions may change this later in the pipeline
    return i;
  }, cart.items),
});

// Here we create the context object that will be passed through the cart pipeline
// We need all the data the pipeline needs loaded on to the context so the pipeline itself can run synchronously
// also makes testing simple as we have no out of process dependencies (database, api's etc)
const createContext = async (context, cart) => {
  const cartContext = {
    context,
    cart: Object.freeze(resetCart(cart)),
    // this is the ravendb cart, we'll update it at the end of pipeline to ensure we sync the DB properly, dont freeze this as it needs to be mutable
    originalCart: cart,
    addresses: context.user ? Object.freeze(await addresses.get(context.user.id)) : [],
    cards: context.user ? Object.freeze(await payments.getStoredCards(context.user)) : [],
    shippingOptions: Object.freeze(await shipping.getShippingOptionsForCountry(context.country.isoCode, cart.shippingMethodId)),
    // if we have a code set on the cart load the discount here so we can use it to apply the discount
    discount: cart.discountCode ? Object.freeze(await discountLoader.getActiveDiscountByCode(context, cart.discountCode)) : null,
    user: context.user || {
      country: context.country.isoCode,
    },
    zesttee: Object.freeze((await taxonomy.getSingleton(SINGLETONS.Configuration)).zesttee),
    validation: {
      discount: {
        valid: true,
        code: null,
      },
    },
  };

  let lazyTotalUsages = futils.fakeLazy(0);
  let lazyTotalUsagesForUser = futils.fakeLazy(0);

  // need to get usage counts for discount validation if we have a discount on the cart
  if (cartContext.discount) {
    lazyTotalUsages = cartContext.discount.usageCount
      ? context.session
          .orders({
            discounts: cartContext.discount.id,
          })
          .not()
          .whereIn('status', [ORDER_STATUS.Cancelled, ORDER_STATUS.PaymentFailed])
          .countLazily()
      : lazyTotalUsages;

    lazyTotalUsagesForUser =
      cartContext.discount.usageCountPerUser && context.user
        ? context.session
            .orders({
              discounts: cartContext.discount.id,
              userId: context.user.id,
            })
            .andAlso()
            .not()
            .whereIn('status', [ORDER_STATUS.Cancelled, ORDER_STATUS.PaymentFailed])
            .countLazily()
        : lazyTotalUsagesForUser;
  }

  // load all items from the DB in to the context, we'll need for validation checks
  const lazyItems = context.session.database.advanced.lazily.load(zesttee.extractItemIds(cart.items));
  const lazyOrderCount = context.user
    ? context.session.orders({ userId: context.user.id }).whereIn('status', CASHBACK_ORDER_STATUS).countLazily()
    : futils.fakeLazy(0);

  // execute all lazy requests in one round trip to DB
  cartContext.totalUsages = await lazyTotalUsages.getValue();
  cartContext.totalUsagesForUser = await lazyTotalUsagesForUser.getValue();
  cartContext.totalOrdersForUser = await lazyOrderCount.getValue();
  cartContext.entities = await lazyItems.getValue();

  Object.values(cartContext.entities).forEach((element) => {
    context.session.database.advanced.evict(element);
  });

  return cartContext;
};

module.exports = {
  createContext,
  execute,
  resetCart,
};
