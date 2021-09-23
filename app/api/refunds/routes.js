const OrderController = require('./controller');
const validator = require('./validator');

const controller = new OrderController();

const Routes = [
  {
    method: 'GET',
    path: '/api/refunds',
    config: {
      description: 'Query refunds',
      handler: controller.query.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        query: validator.searchParams,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/refunds/{id}',
    config: {
      description: 'Get a refund by id',
      handler: controller.get.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.pathId,
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/refunds/{id}',
    config: {
      description: 'Update Refund Status',
      handler: controller.patch.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.pathId,
        },
        payload: validator.updateRefund,
      },
    },
  },
];

module.exports = Routes;
