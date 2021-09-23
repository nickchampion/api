const cache = require('../cache');
const raven = require('../ravendb');
const futils = require('../../utils/futils.js');
const { SHIPMENT_STATUS, SINGLETONS, SHIPPING_TYPE } = require('../../constants');

const getShippingType = (shippingOptions, shippingMethodId) => {
  const option = shippingOptions.find((s) => s.id === shippingMethodId);
  return option.collection ? SHIPPING_TYPE.Collection : SHIPPING_TYPE.Delivery;
};

const getShippingOptions = async () => {
  const shipping = await cache.get('shipping:methods', async () => {
    const session = new raven.Session();
    return session.get(SINGLETONS.Shipping);
  });
  return shipping.methods;
};

const getShippingOptionsForCountry = async (country, selectedId) => {
  const c = country || 'SG';
  const shipping = await getShippingOptions();

  let methods = shipping.filter((s) => s.country === c);
  if (methods.length === 0) methods = shipping.filter((s) => s.country === null);

  return methods.map((m) => {
    return {
      ...m,
      selected: m.id === selectedId,
    };
  });
};

const getFromOrder = async (order) => {
  const options = await getShippingOptionsForCountry(order.country);
  return options.find((o) => o.id === order.shippingMethodId);
};

const applyToOrder = async (order) => {
  const options = await getShippingOptionsForCountry(order.country);
  const option = options.find((o) => o.id === order.shippingMethodId);
  order.shippingMethod = option;
  return order;
};

const apply = (cartContext) => {
  return futils.modify(cartContext, ['cart'], (ctx) => {
    if (!ctx.cart.shippingMethodId) {
      ctx.cart.shippingMethodId = ctx.shippingOptions.find((m) => m.isDefault).id;
    }

    const shipping = ctx.shippingOptions.find((m) => m.id === ctx.cart.shippingMethodId) || ctx.shippingOptions.find((m) => m.isDefault);

    // look to see if we have a discount with free shipping applicable
    if (ctx.discount) {
      const country = ctx.discount.countries.find((c) => c.country === ctx.user.country);

      if (country && country.freeShipping) {
        ctx.cart.shippingTotal = 0;
        return ctx;
      }
    }

    ctx.cart.shippingMethodId = shipping.id;
    ctx.cart.shippingTotal = ctx.cart.orderTotal >= shipping.threshold ? 0 : shipping.price;
    return ctx;
  });
};

const createShipment = async (context) => {
  const courier = context.params.fields.find((f) => f.field === 'courier');
  const tracking = context.params.fields.find((f) => f.field === 'tracking');
  const notes = context.params.fields.find((f) => f.field === 'notes');

  const shipment = {
    items: context.items.map((i) => i.id),
    courier: courier.value || null,
    tracking: tracking.value || null,
    notes: notes.value || null,
    createdAt: new Date().toISOString(),
    deliveredAt: null,
    status: SHIPMENT_STATUS.Pending,
  };

  context.order.shipments = context.order.shipments || [];
  context.order.shipments.push(shipment);
};

module.exports = {
  apply,
  createShipment,
  getShippingOptionsForCountry,
  getShippingOptions,
  applyToOrder,
  getFromOrder,
  getShippingType,
};
