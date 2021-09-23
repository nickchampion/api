const futils = require('../../utils/futils');
const common = require('../../utils/common');
const zesttee = require('../../utils/zesttee');
const { PRODUCT_TYPES } = require('../../constants');

const getFieldValues = (entity, filter, id) => {
  if (filter.field === 'id') return [id];
  return Array.isArray(entity[filter.field]) ? entity[filter.field] : [entity[filter.field]];
};

const operators = {
  eq: (entity, item, filter, id, values) => {
    item.valid = common.commonArrayElements(filter.values, values || getFieldValues(entity, filter, id));
  },
  neq: (entity, item, filter, id, values) => {
    item.valid = !common.commonArrayElements(filter.values, values || getFieldValues(entity, filter, id));
  },
};

const filters = {
  product: (ctx) => {
    operators[ctx.filter.operator](ctx.cartContext.entities[zesttee.extractItemId(ctx.item)], ctx.item, ctx.filter, zesttee.extractItemId(ctx.item));
  },
  item: (ctx) => {
    operators[ctx.filter.operator](ctx.item, ctx.item, ctx.filter, ctx.item.id);
  },
  user: (ctx) => {
    operators[ctx.filter.operator](ctx.cartContext.user, ctx.item, ctx.filter, ctx.cartContext.user.id);
  },
  type: (ctx) => {
    // special handling for type so we can search metadata
    if (ctx.item.type === PRODUCT_TYPES.Pack || ctx.item.type === PRODUCT_TYPES.CustomPack) {
      ctx.item.metadata.contents.forEach((i) => {
        if (ctx.item.valid) operators[ctx.filter.operator](ctx.item, ctx.item, ctx.filter, ctx.item.id, [i.type]);
      });
    } else {
      operators[ctx.filter.operator](ctx.item, ctx.item, ctx.filter, ctx.item.id);
    }
  },
};

const applyFilter = (cartContext, filter) => {
  cartContext.cart.items
    .filter((i) => i.valid)
    .map((item) => {
      return {
        cartContext,
        item,
        filter,
      };
    })
    .forEach((ctx) => filters[ctx.filter.source](ctx));
};

const apply = (cartContext) => {
  if (!cartContext.discount.restrictions.filters) return cartContext;

  return futils.modify(cartContext, ['cart'], (ctx) => {
    // apply each filter to the cart items, will set valid to true / false for each item
    ctx.discount.restrictions.filters.forEach((f) => applyFilter(ctx, f));

    // retun the updated context
    return ctx;
  });
};

module.exports = {
  apply,
};

/*
Filter is defined as

{
    "source": "product|item" // should the filter be applied to the cart item or the product
    "operator": "eq|neq" // which operator to apply when comparing
    "field": "id", // field on the product or cart item to apply the filter to
    "values": [ // values that the field must match for the filter to apply (or not match if we dont use include as the option)
        "packs/3073-A"
    ]
}
*/
