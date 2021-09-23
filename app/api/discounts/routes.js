const DiscountController = require('./controller');
const validator = require('./validator');

const controller = new DiscountController();

const Routes = [
  {
    method: 'POST',
    path: '/api/discounts',
    config: {
      description: 'Create a discount',
      handler: controller.create.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        payload: validator.create,
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/discounts/{id}',
    config: {
      description: 'Update a discount',
      handler: controller.patch.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        params: {
          id: validator.pathId,
        },
        payload: validator.patch,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/discounts',
    config: {
      description: 'Search for discounts',
      handler: controller.query.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        query: validator.searchParams,
      },
    },
  },
];

module.exports = Routes;
