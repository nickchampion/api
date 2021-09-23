/* eslint-disable no-underscore-dangle */
const context = require('../utils/context');

const register = (server) => {
  server.ext('onPreHandler', async (request, h) => {
    request.context = await context.createFromRequest(request);
    return h.continue;
  });
};

exports.plugin = {
  name: 'context',
  register,
};
