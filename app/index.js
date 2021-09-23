require('dotenv').config();

const JwtAuth = require('hapi-auth-jwt2');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Bell = require('@hapi/bell');
const hapiBasic = require('@hapi/basic');
const joi = require('@hapi/joi');
const HapiSwagger = require('hapi-swagger');
const config = require('./modules/configuration').config();
const routes = require('./api/routes');
const errordite = require('./modules/errordite');
const bootstrap = require('./modules/ravendb/bootstrap');
const i18n = require('./plugins/i18n');
const ravendb = require('./plugins/ravendb');
const errorCode = require('./plugins/errorCode');
const errorditePlugin = require('./plugins/errordite');
const context = require('./plugins/context');
// const jobs = require('./jobs');

// needed to init the cache topic
// const cacheTopic = require('./services/azure/topics/cache');

// create new server instance
const server = new Hapi.Server({
  host: process.env.APP_HOST || 'localhost',
  port: process.env.PORT,
  routes: {
    cors: {
      // an array of origins or 'ignore'
      origin: ['*'],
      // an array of strings - 'Access-Control-Allow-Headers'
      headers: ['Authorization', 'Cart-Token', 'Content-Type', 'Z-Timezone-Offset', 'Z-Profile', 'Z-Impersonator', 'Z-Country'],
      credentials: true,
    },
    validate: {
      failAction: async (request, h, err) => {
        if (config.production) {
          // In prod, log a limited error message and throw the default Bad Request error.
          throw err;
        } else {
          // During development, log and respond with the full error.
          // eslint-disable-next-line no-console
          console.error(err);
          throw err;
        }
      },
    },
  },
});

// Create server socket
const validateUser = (decoded) => {
  // This is a simple check that the `sub` claim
  // exists in the access token. Modify it to suit
  // the needs of your application
  if (decoded && decoded.id) {
    return {
      isValid: true,
    };
  }

  return {
    isValid: false,
  };
};

const initialisation = async () => {
  if (config.dev) return;

  // schedule jobs
  // jobs.schedule();

  try {
    // bootstrap app
    await bootstrap();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

const apiVersionOptions = {
  basePath: '/api/',
  validVersions: [1, 2],
  defaultVersion: 2,
  vendorName: 'api/',
};

const swaggerOptions = {
  pathPrefixSize: 4,
  host: server.info.uri,
  basePath: apiVersionOptions.basePath,
  info: {
    title: 'Zesttee API Documentation',
  },
  deReference: false,
  securityDefinitions: {
    jwt: {
      type: 'Add Authorization Token here',
      name: 'Authorization',
      in: 'header',
    },
  },
  expanded: 'none',
  security: [{ jwt: [] }],
};

async function start() {
  // start your server
  const plugins = [
    {
      plugin: context,
    },
    Inert,
    Vision,
    JwtAuth,
    Bell,
  ];

  if (config.swaggerEnabled) {
    plugins.push({
      plugin: HapiSwagger,
      options: swaggerOptions,
    });
  }

  plugins.push({
    plugin: i18n,
    options: {
      locales: ['en'],
      directory: `${__dirname}/i18n`,
      defaultLocale: 'en',
      languageHeaderField: 'accept-language',
    },
  });

  plugins.push({
    plugin: errorCode,
  });

  plugins.push({
    plugin: errorditePlugin,
  });

  plugins.push({
    plugin: hapiBasic,
  });

  plugins.push({
    plugin: ravendb,
  });

  await server.register(plugins);

  server.auth.strategy('jwt', 'jwt', {
    key: config.security.jwtSecret,
    validate: validateUser,
    verifyOptions: {
      ignoreExpiration: true,
    },
  });

  // server.auth.strategy('basic', 'basic', { validate: validateUserBasicAuth });
  server.auth.default('jwt');
  server.validator(joi);
  server.route(routes);

  // run any init code before we start the server
  await initialisation();

  // set up global promise rejection error handler so we dont crash node in the future when UnhandledPromiseRejections are deprecated
  process.on('unhandledRejection', (reason, promise) => {
    if (reason instanceof Error) {
      reason.name = reason.name || 'Unhandled Rejection';
      errordite.log(reason);
    } else {
      errordite.log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    }
  });

  // set up global error handler for any unhandled errors
  process.on('uncaughtException', (err) => {
    err.name = err.name || 'Uncaught Exception';
    errordite.log(err);
  });

  // await cacheTopic.start();
  await server.start();

  return server;
}

start()
  .then((s) => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on ${s.info.uri}`);
  })
  .catch((err) => {
    errordite.log(err);
    process.exit(1);
  });

module.exports = server;
