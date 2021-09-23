const OrderController = require('./controller');
const validator = require('./validator');

const controller = new OrderController();

const Routes = [
  {
    method: 'GET',
    path: '/api/admin/orders',
    config: {
      description: 'Get Order admin list',
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
    path: '/api/admin/orders/{id}',
    config: {
      description: 'Get a Order admin',
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
    path: '/api/admin/orders/{id}',
    config: {
      description: 'Update Order admin',
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
        payload: validator.updateOrder,
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/admin/orders/{id}/address',
    config: {
      description: 'Update Order Address',
      handler: controller.address.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.pathId,
        },
        payload: validator.address,
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/admin/orders/{id}/comment',
    config: {
      description: 'Add comment to an order',
      handler: controller.comment.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.pathId,
        },
        payload: validator.comment,
      },
    },
  },
];

module.exports = Routes;
