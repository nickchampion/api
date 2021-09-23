const { PRODUCT_TYPES } = require('../../constants');
const raven = require('../ravendb');

const formatCartPrices = (context, cart) => {
  cart.orderTotal = context.utils.formatCurrency(cart.orderTotal);
  cart.discountTotal = context.utils.formatCurrency(cart.discountTotal);
  cart.shippingTotal = context.utils.formatCurrency(cart.shippingTotal);
  cart.subTotal = context.utils.formatCurrency(cart.subTotal);
  cart.discounts.total = context.utils.formatCurrency(cart.discounts.total);
  cart.amountPayable = context.utils.formatCurrency(cart.amountPayable);
  cart.shippingThreshold = context.utils.formatCurrency(cart.shippingThreshold);

  cart.items.forEach((item) => {
    item.price = context.utils.formatCurrency(item.price);
    item.subTotal = context.utils.formatCurrency(item.subTotal);
    item.total = context.utils.formatCurrency(item.total);
    item.discounts.total = context.utils.formatCurrency(item.discounts.total);

    delete item.plan;
  });

  return cart;
};

const cartProducts = (context, products, payload) => {
  return products.map((product) => {
    const item = payload.find((p) => p.id === product.id);
    const variant = item.variantId && product.variants && product.variants.length > 0 ? product.variants.find((v) => v.id === item.variantId) : null;
    const price = context.utils.price(variant ? variant.prices : product.prices);
    const variantName = variant ? ` (${variant.id} ${variant.size || ''})` : '';

    return {
      quantity: item.qty || 1,
      type: product.type,
      name: `${product.name}${variantName}`,
      price,
      subTotal: price,
      total: price,
      skuId: raven.Models.Product.getId(product.id),
      image: product.images ? product.images.primary : null,
      metadata: {
        categoryIds: product.categoryIds,
      },
      variantId: variant ? variant.id : null,
      discounts: {
        total: 0,
        applied: [],
      },
    };
  });
};

const cartBundles = (context, bundles, payload) => {
  return bundles.map((bundle) => {
    const info = payload.find((p) => p.id === bundle.id);
    const price = context.utils.price(bundle.prices);

    const result = {
      quantity: info ? info.qty : 1,
      type: PRODUCT_TYPES.Bundle,
      name: bundle.name,
      price,
      subTotal: price,
      total: price,
      skuId: raven.Models.Bundle.getId(bundle.id),
      image: bundle.images ? bundle.images.primary : null,
      metadata: {
        categoryIds: bundle.categoryIds,
        contents: bundle.contents,
      },
      discounts: {
        total: 0,
        applied: [],
      },
    };

    return result;
  });
};

module.exports = {
  cartProducts,
  cartBundles,
  formatCartPrices,
};
