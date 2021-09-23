const users = require('../../modules/users');
const { USER_STATUS, ROLES } = require('../../constants');

class UserController {
  async query(request) {
    if (!request.context.query.orderBy) request.context.query.orderBy = '-createdAt';
    return users.query(request.context);
  }

  async get(request) {
    return users.get(request, request.params.id);
  }

  async patch(request) {
    return users.patch(request, request.params.id, request.payload);
  }

  async delete(request) {
    await users.hardDelete(request.context, request.params.id);
    return { success: true };
  }

  async getAdminUsers(request) {
    return users.query(request.context, (query) => query.whereNotEquals('roles', ROLES.User));
  }

  async setRole(request) {
    return users.patch(request, request.params.id, {
      roles: [request.payload.role],
    });
  }

  async disableUser(request) {
    return users.patch(request, request.params.id, {
      status: USER_STATUS.Disabled,
    });
  }
}

module.exports = UserController;
