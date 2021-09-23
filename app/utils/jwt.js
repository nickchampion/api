const jsonwebtoken = require('jsonwebtoken');
const _ = require('lodash');
const config = require('../modules/configuration').config();
const raven = require('../modules/ravendb');

const tokenFields = ['email', 'id', 'country', 'scope', 'phone', 'status', 'notifications', 'stripeId'];

class Jwt {
  constructor() {
    this.secret = config.security.jwtSecret;
    this.ttl = config.security.jwtTokenExpiryDays * (24 * 60 * 60 * 1000); // Token will expire in 7 days
  }

  issue(user) {
    user.id = raven.Models.User.getId(user.id);

    if (!user.scope) user.scope = user.roles;

    return jsonwebtoken.sign(
      _.assign(_.pick(user, tokenFields), {
        ttl: this.ttl,
      }),
      this.secret,
    );
  }

  decode(token) {
    try {
      return jsonwebtoken.verify(token, this.secret);
    } catch (err) {
      return null;
    }
  }

  extractCredentials(request) {
    let token = request.headers.authorization;
    if (token) {
      token = token.replace('Bearer ', '');
      return this.decode(token);
    }
    return null;
  }
}

module.exports = new Jwt();
