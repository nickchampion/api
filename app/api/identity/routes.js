const validator = require('./validator');
const IdentityController = require('./controller');

const controller = new IdentityController();

const Routes = [
  {
    method: 'POST',
    path: '/api/identity/login',
    config: {
      description: 'Login to an account',
      tags: ['api', 'client'],
      handler: controller.login.bind(controller),
      auth: false,
      validate: {
        payload: validator.login,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/register',
    config: {
      description: 'Register an account to system',
      tags: ['api', 'client'],
      handler: controller.register.bind(controller),
      auth: false,
      validate: {
        payload: validator.register,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/verifyOtp',
    config: {
      description: 'Verify users OTP',
      tags: ['api', 'client'],
      handler: controller.verifyOtp.bind(controller),
      auth: {
        mode: 'optional',
      },
      validate: {
        payload: validator.verifyOtp,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/capturePassword',
    config: {
      description: 'Compelte account setup without phone verification at the end of the survey',
      tags: ['api', 'client'],
      handler: controller.capturePassword.bind(controller),
      auth: {
        mode: 'optional',
      },
      validate: {
        payload: validator.capturePassword,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/sendOtp',
    config: {
      description: 'Send OTP',
      tags: ['api', 'client'],
      handler: controller.sendOtp.bind(controller),
      auth: {
        mode: 'optional',
      },
      validate: {
        payload: validator.sendOtp,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/logout',
    config: {
      description: 'Logout api',
      tags: ['api', 'client'],
      handler: controller.logout.bind(controller),
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/api/identity/forgotPassword',
    config: {
      description: 'Forgot password api',
      tags: ['api', 'client'],
      handler: controller.forgotPassword.bind(controller),
      auth: false,
      validate: {
        payload: validator.forgotPassword,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/resetPassword',
    config: {
      description: 'reset password api',
      tags: ['api', 'client'],
      handler: controller.resetPassword.bind(controller),
      auth: false,
      validate: {
        payload: validator.resetPassword,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/identity/accountExists',
    config: {
      description: 'Check an account is exist or not',
      tags: ['api', 'client'],
      handler: controller.accountExists.bind(controller),
      auth: false,
      validate: {
        query: validator.accountExists,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/phoneExists',
    config: {
      description: 'Check if a phone number exists',
      tags: ['api', 'client'],
      handler: controller.phoneExists.bind(controller),
      auth: false,
      validate: {
        payload: validator.phoneExists,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/identity/location',
    config: {
      description: 'GEO IP Look up users location',
      tags: ['api', 'client'],
      handler: controller.location.bind(controller),
      auth: false,
      validate: {
        query: validator.geoLookup,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/identity/verifyToken',
    config: {
      description: 'Validates an account completion token and returns user',
      tags: ['api', 'client'],
      handler: controller.verifyToken.bind(controller),
      auth: false,
      validate: {
        payload: validator.checkToken,
      },
    },
  },
];

module.exports = Routes;
