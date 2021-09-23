const ShippingMethodController = require('./controller');

const controller = new ShippingMethodController();
const { checkToken } = require('../../utils/validation');

const Routes = [
  {
    method: 'GET',
    path: '/api/shippingMethods',
    config: {
      description: 'Get shipping methods',
      handler: controller.get.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: checkToken,
      },
    },
  },
];

module.exports = Routes;
