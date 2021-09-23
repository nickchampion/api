/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Users extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Users', (user) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      country: user.country,
      roles: user.roles,
      userId: user.userId,
      createdAt: user.createdAt,
      notifications: user.notifications,
      passwordToken: user.passwordToken,
      passwordExpire: user.passwordExpire,
      query: [user.firstName, user.lastName, user.email, user.phone, id(user).split('/')[1]],
      patch: user.patch,
    }));

    this.index('query', 'Search');
  }
}

module.exports = new Users();
