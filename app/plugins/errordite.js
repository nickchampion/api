const errordite = require('../modules/errordite');

const keyPattern = new RegExp(/^[A-Z_]+$/);

const register = (server) => {
  server.events.on({ name: 'request' }, (request, event) => {
    if (event.error) {
      const logged = event.error.logged || (event.error.data && event.error.data.includes && event.error.data.includes('nolog'));

      if (!logged) {
        if (event.error.message && event.error.data && event.error.data instanceof Array) {
          // eslint-disable-next-line no-underscore-dangle
          event.error.message = keyPattern.test(event.error.message) ? request.i18n.__(event.error.message) : event.error.message;

          for (let i = 0; i < event.error.data.length; i += 1) {
            event.error.message = event.error.message.replace(`{${i}}`, event.error.data[i]);
          }
        }

        errordite.log(event.error, request);
      }

      event.error.logged = true;
    }
  });
};

exports.plugin = {
  name: 'errordite',
  register,
};
