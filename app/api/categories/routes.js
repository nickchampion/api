const CategoryController = require('./controller');
const validator = require('./validator');

const controller = new CategoryController();

const Routes = [
  {
    method: 'GET',
    path: '/api/categories',
    config: {
      description: 'Query categories',
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
    path: '/api/categories/{id}',
    config: {
      description: 'Get a category',
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
    path: '/api/categories',
    config: {
      description: 'Create a category',
      handler: controller.create.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        payload: validator.createCategory,
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/categories/{id}',
    config: {
      description: 'Update a category',
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
        payload: validator.updateCategory,
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/categories/{id}',
    config: {
      description: 'Delete a category',
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
