const Controller = require('./controller');

const controller = new Controller();

const Routes = [
  {
    method: 'POST',
    path: '/api/stripe/events',
    config: {
      handler: controller.events.bind(controller),
      auth: false,
      validate: {
        options: {
          allowUnknown: true,
        },
      },
      payload: {
        output: 'data',
        parse: false,
      },
    },
  },
];

module.exports = Routes;
