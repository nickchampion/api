const Boom = require('@hapi/boom');

const register = (server) => {
  server.ext('onPreResponse', async (request, h) => {
    if (request.method === 'options' || !request.response || !request.context || !request.context.session) return h.continue;

    const { response } = request;

    // if there is no error commit the session.
    // Dont commit GET requests as these should never change state
    if (!Boom.isBoom(response) && (request.method !== 'get' || request.context.session.commitOnGet)) {
      await request.context.session.commit();
    }

    request.response.header('z-profiler', request.context.profiler.summary());
    return h.continue;
  });
};

exports.plugin = {
  name: 'ravendb',
  register,
};
