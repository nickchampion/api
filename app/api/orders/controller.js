const orders = require('../../modules/orders');
const refunds = require('../../modules/orders/refunds');
const stateMachine = require('../../modules/orders/stateMachine');
const raven = require('../../modules/ravendb');
const map = require('../../modules/map');
const shipping = require('../../modules/shipping');
const taxonomy = require('../../modules/taxonomy');
const common = require('../../utils/common');
const cache = require('../../modules/cache');
const { PAYMENT_PROVIDERS, CACHE_KEYS } = require('../../constants');

class OrderController {
  async query(request) {
    return orders.query(request, request.query.userId, (o) => map.orderSummary(request.context, o));
  }

  async get(request) {
    const order = await orders.get(request, request.params.id);
    await stateMachine.setOrderTransitions(request.context, order);
    return shipping.applyToOrder(order);
  }

  async comment(request) {
    return orders.addComment(request.context);
  }

  async patch(request) {
    const actions = {
      refund: async () => {
        return refunds.statusUpdate({
          id: request.params.id,
          fields: request.payload.fields,
          context: request.context,
        });
      },
      shipping: async () => {
        return orders.switchShippingType({
          id: request.params.id,
          context: request.context,
        });
      },
      order: async () => {
        return orders.statusUpdate({
          id: request.params.id,
          status: request.payload.status,
          fields: request.payload.fields,
          items: request.payload.items,
          allItems: request.payload.allItems,
          context: request.context,
          provider: PAYMENT_PROVIDERS.Cash,
        });
      },
    };

    const result = await actions[request.payload.entity]();

    const order = map.order(
      request.context,
      raven.utils.clone(result.order, {
        user: result.user,
        refund: result.refund,
      }),
      await taxonomy.getCategories(),
    );

    await stateMachine.setOrderTransitions(request.context, order);
    return order;
  }

  async address(request) {
    const order = await request.context.session.get(raven.Models.Order.getId(request.params.id));
    const addressBook = await request.context.session.get(raven.Models.AddressBook.getId(order.userId));

    if (addressBook) {
      const address = addressBook.addresses.find((a) => a.id === order.shipping.id);

      if (address) {
        cache.del(common.format(CACHE_KEYS.AddressBook, raven.utils.friendlyId(request.context.user.id)));
        common.copy(request.context.payload, address);
      }
    }

    common.copy(request.context.payload, order.shipping);
    return order.shipping;
  }
}

module.exports = OrderController;
