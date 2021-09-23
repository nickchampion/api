const controller = require('./controller');
const validator = require('./validator');

const Routes = [
  {
    method: 'GET',
    path: '/api/dashboards',
    config: {
      description: 'Get Dashboard admin list',
      handler: controller.dashboard,
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        query: validator.validateCount,
      },
    },
  },
];

module.exports = Routes;
