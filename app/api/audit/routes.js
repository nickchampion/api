const validator = require('./validator');
const AuditController = require('./controller');

const controller = new AuditController();

const Routes = [
  {
    method: 'GET',
    path: '/api/audit',
    config: {
      description: 'Query the audit log',
      handler: controller.query.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        query: validator.searchParams,
        options: {
          allowUnknown: true,
        },
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/alert/{id}',
    config: {
      description: 'Delete an alert',
      handler: controller.delete.bind(controller),
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
