/* eslint-disable no-underscore-dangle */
const Boom = require('@hapi/boom');
const config = require('../modules/configuration').config();

const keyPattern = new RegExp(/^[A-Z_]+$/);

const register = (server) => {
  server.ext('onPreResponse', (request, h) => {
    if (!request.i18n || !request.response) {
      return h.continue;
    }

    const { response } = request;

    if (Boom.isBoom(response)) {
      if (response.message && response.stack) response.output.payload.message = response.message;

      if (response.output.payload.message.toLowerCase().trim() === 'an internal server error occurred') {
        response.output.payload.message = 'COMMON_INTERNAL_SERVER_ERROR';
      }

      let i18Message = keyPattern.test(response.output.payload.message)
        ? request.i18n.__(response.output.payload.message)
        : response.output.payload.message;

      let code = null;

      if (response.data && response.data instanceof Array) {
        for (let i = 0; i < response.data.length; i += 1) {
          if (response.data[i] && response.data[i].indexOf && response.data[i].indexOf('code:') === -1)
            i18Message = i18Message.replace(`{${i}}`, response.data[i]);
          // eslint-disable-next-line prefer-destructuring
          else code = response.data[i].split(':')[1];
        }
      }

      response.output.payload.message = i18Message;

      if (!config.production) response.output.payload.stack = response.stack || '';
      if (response.token) response.output.payload.token = response.token;
      if (code) response.output.payload.code = code;
    }

    return response;
  });
};

exports.plugin = {
  name: 'errorCode',
  register,
};
