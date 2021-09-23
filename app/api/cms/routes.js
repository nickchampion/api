const CmsController = require('./controller');
const validator = require('./validator');

const controller = new CmsController();

const Routes = [
  {
    method: 'POST',
    path: '/api/cms/{id}/publish',
    config: {
      description: 'Create a new cms admin',
      handler: controller.publish.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/api/cms/sync',
    config: {
      description: 'Receive update from staging',
      handler: controller.sync.bind(controller),
      auth: false,
      validate: {
        payload: validator.sync,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/cms',
    config: {
      description: 'Get cms admin list',
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
    path: '/api/cms/{id}',
    config: {
      description: 'Get a cms admin',
      handler: controller.get.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/api/cms',
    config: {
      description: 'Create a new cms admin',
      handler: controller.create.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        payload: validator.createCms,
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/cms/{id}',
    config: {
      description: 'Update cms admin',
      handler: controller.patch.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
        payload: validator.updateCms,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/cms/{id}',
    config: {
      description: 'Delete a cms admin',
      handler: controller.delete.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
      },
    },
  },
];

module.exports = Routes;
