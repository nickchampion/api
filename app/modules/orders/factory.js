const moment = require('moment');
const Boom = require('@hapi/boom');
const _ = require('lodash');
const R = require('ramda');
const raven = require('../ravendb');
const shipping = require('../shipping');
const math = require('../../utils/math');
const { PAYMENT_PROVIDERS, ORDER_STATUS, CREDIT_CASHBACK_STATUS } = require('../../constants');

function validate(args, addressInfo) {
  if (args.cart.paymentProvider === PAYMENT_PROVIDERS.Stripe) {
    if (!addressInfo.billing && !addressInfo.shipping) throw Boom.badRequest('CART_NO_ADDRESS');
  }
}

function createOrderFromCart(args) {
  // extract address info for the order
  const addressInfo = extractAddresses(args);

  // make sure everythign is in order
  validate(args, addressInfo);

  const order = new raven.Models.Order({
    userId: raven.Models.User.getId(args.user.id),
    items: [],
    shipping: addressInfo.shipping || null,
    billing: addressInfo.billing || null,
    country: args.user.country || (addressInfo.shipping ? addressInfo.shipping.country : null),
    currency: args.cart.currency,
    exchangeRate: args.context.country.exchangeRate,
    orderTotal: args.cart.orderTotal,
    discountTotal: args.cart.discountTotal,
    shippingTotal: args.cart.shippingTotal,
    deliveryInstructions: args.context.payload.deliveryInstructions || null,
    discountCode: args.cart.discountCode,
    subTotal: args.cart.subTotal,
    shippingMethodId: args.cart.shippingMethodId,
    shippingType: shipping.getShippingType(args.shippingMethods, args.cart.shippingMethodId),
    cartId: raven.Models.Cart.getId(args.cart.id),
    payments: [],
    status: ORDER_STATUS.Pending,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    discounts: {
      ...args.cart.discounts,
      ids: getDiscountIds(args.cart),
    },
  });

  const amountPayable = math.round(args.cart.orderTotal - args.cart.credits.spent);

  if (amountPayable > 0) {
    const payment = {
      amount: amountPayable,
      provider: args.cart.paymentProvider || PAYMENT_PROVIDERS.Stripe,
    };

    if (payment.provider === PAYMENT_PROVIDERS.Stripe) {
      payment.paymentMethodId = args.context.payload.paymentMethodId;
      payment.expiresAt = moment.utc(order.createdAt).add(7, 'days').toISOString();
    }

    order.payments.push(payment);
  }

  order.discounts.applied.forEach((d) => {
    delete d.changeVector;
    delete d.description;
  });

  let id = 1;
  args.cart.items.forEach((item) => {
    // this adjusts the discount so its per item quantity
    item.discounts.applied.forEach((discount) => {
      discount.total = discount.amount;
      delete discount.amount;
      delete discount.changeVector;
      delete discount.description;
    });

    item.discounts.total = math.round(_.sumBy(item.discounts.applied, (d) => d.total));

    if (item.metadata && item.metadata.contents) {
      item.metadata.contents = item.metadata.contents.filter((p) => !Object.prototype.hasOwnProperty.call(p, 'included') || p.included);
      item.metadata.contents.forEach((i) => {
        delete i.included;
      });
    }

    for (let i = 0; i < item.quantity; i += 1) {
      order.items.push({
        id,
        skuId: item.skuId,
        name: item.name,
        image: item.image,
        price: item.price,
        salePrice: math.round(item.price - item.discounts.total),
        type: item.type,
        variantId: item.variantId,
        status: ORDER_STATUS.Pending,
        discounts: item.discounts,
        metadata: item.metadata,
      });

      id += 1;
    }
  });

  return order;
}

function extractAddresses(args) {
  let shippingAddress = args.addresses.find((a) => a.id === args.context.payload.addressId);
  let billingAddress = args.addresses.find((a) => a.id === args.context.payload.billingAddressId);

  if (shippingAddress) {
    if (!args.user.firstName && shippingAddress.firstName) args.user.firstName = shippingAddress.firstName;
    if (!args.user.lastName && shippingAddress.lastName) args.user.lastName = shippingAddress.lastName;
  }

  if (billingAddress) {
    if (!args.user.firstName && billingAddress.firstName) args.user.firstName = billingAddress.firstName;
    if (!args.user.lastName && billingAddress.lastName) args.user.lastName = billingAddress.lastName;
  }

  // if there is no shipping address but a billing store billing as shipping and set billing to null
  // we should only store a billing address IF its different to the shipping address
  if (!shippingAddress) shippingAddress = billingAddress;
  if (shippingAddress && billingAddress && shippingAddress.id === billingAddress.id) billingAddress = null;

  return {
    shipping: shippingAddress
      ? {
          ...shippingAddress,
        }
      : null,
    billing: billingAddress
      ? {
          ...billingAddress,
        }
      : null,
  };
}

function getDiscountIds(cart) {
  const itemDiscounts = R.compose(
    R.flatten, // flatten into single dimensional array
    R.map((v) => v.discounts.applied),
  )(cart.items);

  return R.compose(
    R.uniqBy((v) => v.id),
    R.filter((i) => i.id),
    R.map((v) => {
      return {
        id: v.id,
        changeVector: v.changeVector,
      };
    }),
    R.concat, // combine both discount arrays
  )(itemDiscounts, cart.discounts.applied);
}

module.exports = {
  createOrderFromCart,
};
