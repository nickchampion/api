const identity = require('../../modules/identity');
const { getCartToken } = require('../../utils/crypto');
const geo = require('../../modules/geo');

class IdentityController {
  async login(request) {
    return identity.login(request.context);
  }

  async register(request) {
    return identity.register(request.context);
  }

  async capturePassword(request) {
    return request.context.session.try(() => identity.capturePassword(request.context), 3, 250);
  }

  async verifyOtp(request) {
    return identity.verifyOtp(request.context);
  }

  async sendOtp(request) {
    return identity.sendOtp(request.context);
  }

  async logout() {
    return {
      message: 'Log out success',
    };
  }

  async forgotPassword(request) {
    return identity.forgotPassword(request.context);
  }

  async resetPassword(request) {
    return identity.resetPassword(request.context);
  }

  async getCartToken(request) {
    return {
      token: request.headers['cart-token'] || getCartToken(),
    };
  }

  async location(request) {
    return geo.getGeoLocation(request.context);
  }

  async accountExists(request) {
    return identity.accountExists(request.context);
  }

  async phoneExists(request) {
    return identity.phoneExists(request.context);
  }

  async verifyToken(request) {
    return identity.verifyToken(request.context);
  }
}

module.exports = IdentityController;
