const refunds = require('../../modules/orders/refunds');
const raven = require('../../modules/ravendb');
const map = require('../../modules/map');

class RefundController {
  async query(request) {
    return refunds.query(request.context);
  }

  async get(request) {
    return refunds.get(request.context);
  }

  async patch(request) {
    const result = await refunds.statusUpdate({
      id: request.params.id,
      status: request.payload.status,
      items: request.payload.items,
      request,
    });

    return map.refund(request.context, raven.utils.clone(result.refund));
  }
}

module.exports = RefundController;
