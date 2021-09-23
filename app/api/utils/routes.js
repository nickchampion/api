const Joi = require('@hapi/joi');
const Controller = require('./controller');

const controller = new Controller();
const { pathId, checkToken } = require('../../utils/validation');

const validateEncryption = {
  input: Joi.string(),
  key: Joi.string(),
};

const Routes = [
  {
    method: 'GET',
    path: '/api/utils/bootstrap',
    config: {
      handler: controller.bootstrap.bind(controller),
      auth: false,
      timeout: {
        server: 60000000,
        socket: 60000001,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/utils/job/{id}',
    config: {
      handler: controller.job.bind(controller),
      auth: 'jwt',
      validate: {
        params: {
          id: pathId,
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/api/utils/cache',
    config: {
      handler: controller.cache.bind(controller),
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/api/utils/config',
    config: {
      handler: controller.config.bind(controller),
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/api/utils/encrypt',
    config: {
      handler: controller.encrypt.bind(controller),
      auth: false,
      validate: {
        payload: validateEncryption,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/utils/decrypt',
    config: {
      handler: controller.decrypt.bind(controller),
      auth: false,
      validate: {
        payload: validateEncryption,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/utils/temp/{id}',
    config: {
      handler: controller.temp.bind(controller),
      auth: false,
      timeout: {
        server: 10000000,
        socket: 100000000,
      },
      validate: {
        params: {
          id: pathId,
        },
        query: {
          email: Joi.string().optional(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/api/utils/encodeId',
    config: {
      handler: controller.encodeId.bind(controller),
      auth: false,
      validate: {
        query: {
          id: Joi.string(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/api/utils/decodeId',
    config: {
      handler: controller.decodeId.bind(controller),
      auth: false,
      validate: {
        query: {
          id: Joi.string(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/api/utils/encode',
    config: {
      handler: controller.encode.bind(controller),
      auth: false,
      validate: {
        query: {
          id: Joi.string(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/api/utils/decode',
    config: {
      handler: controller.decode.bind(controller),
      auth: false,
      validate: {
        query: {
          id: Joi.string(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/api/utils/emails/{id}',
    config: {
      handler: controller.emails.bind(controller),
      auth: 'jwt',
      validate: {
        params: {
          id: pathId,
        },
      },
    },
  },
];

module.exports = Routes;
