const Base = require('./Base');

class User extends Base {
  id
  firstName = null
  lastName = null
  email = null
  password = null
  createdAt = null
  updatedAt = null
  country = null
  passwordToken = null
  passwordExpire = null
  status = null
  phone = null
  connections = {}
  roles = []
  notifications = []
  stripeId = null
  twoFactorAuthEnabled = false
  patch = null

  constructor(user) {
    super('Users', 'users');
    this.merge(this, user);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    return id ? id.indexOf('/') === -1 ? `users/${id}` : id : id;
  }

  static getIndexName() {
    return 'Users';
  }
}

module.exports = User;
