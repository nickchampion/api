const Controller = require('./controller');

const controller = new Controller();

const Routes = [
  {
    method: 'POST',
    path: '/api/test/prepare',
    config: {
      auth: false,
      handler: controller.prepare.bind(controller),
    },
  },
  {
    method: 'POST',
    path: '/api/test/init',
    config: {
      auth: false,
      handler: controller.init.bind(controller),
    },
  },
];

module.exports = Routes;
