const UserController = require('./controller');
const validator = require('./validator');

const controller = new UserController();

const Routes = [
  {
    method: 'GET',
    path: '/api/users',
    config: {
      description: 'Get User admin list',
      handler: controller.query.bind(controller),
      auth: {
        strategy: 'jwt',
      },
      validate: {
        headers: validator.checkToken,
        query: validator.searchParams,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/users/{id}',
    config: {
      description: 'Get a User admin',
      handler: controller.get.bind(controller),
      auth: {
        strategy: 'jwt',
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
    method: 'GET',
    path: '/api/users/admin',
    config: {
      description: 'Get User for admin page list',
      handler: controller.getAdminUsers.bind(controller),
      auth: {
        strategy: 'jwt',
      },
      validate: {
        headers: validator.checkToken,
        query: validator.searchParams,
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/users/{id}/setRole',
    config: {
      description: 'Set role for user',
      handler: controller.setRole.bind(controller),
      auth: {
        strategy: 'jwt',
      },
      validate: {
        headers: validator.checkToken,
        payload: validator.rolePayload,
        params: {
          id: validator.pathId,
        },
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/users/{id}',
    config: {
      description: 'Hard delete a user',
      handler: controller.delete.bind(controller),
      auth: {
        strategy: 'jwt',
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
    path: '/api/users/{id}/disableUser',
    config: {
      description: 'Mark a user as disabled',
      handler: controller.disableUser.bind(controller),
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
];

module.exports = Routes;
