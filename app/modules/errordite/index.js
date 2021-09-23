/* eslint-disable no-console */
const rp = require('request-promise-native');
const _ = require('lodash');
const config = require('../configuration').config();

const regex = RegExp(/(?<=at )(.*?)(?= \()/);

const getServerContext = (user, req, context) => {
  if (req) {
    const merged = _.merge(_.merge(req.headers, context), {
      UtcOffset: new Date().getTimezoneOffset() / -60.0,
      UserId: user.id,
      Role: user.role,
      Email: user.email,
      Language: req.language,
      Locale: req.locale,
      Method: req.method,
      IsAuthenticated: req.auth.isAuthenticated,
      IsAuthorized: req.auth.isAuthorized,
      Payload: req.payload ? JSON.stringify(req.payload) : null,
      Query: req.query ? JSON.stringify(req.query) : null,
    });

    if (merged.authorization) delete merged.authorization;

    return merged;
  }

  return context || {};
};

const extractMessageFromError = (err) => {
  if (!err) return 'Unknown error';

  if (typeof err === 'string') return err;

  if (err.message) return err.message;

  if (err.msg) return err.msg;

  if (err.response && typeof err.response === 'string') return err.response;

  return 'Unknown error';
};

const getPayload = (req, error) => {
  const now = new Date();

  const user = (req && req.auth.credentials) || {
    id: 0,
    role: 'user',
    scope: 'user',
  };

  const method = regex.exec(error.stack);

  const payload = {
    Token: config.errordite.token,
    MachineName: 'Node',
    Url: req ? req.url.href : '',
    UserAgent: req ? req.headers['user-agent'] : '',
    ContextData: getServerContext(user, req, error.context || {}),
    ExceptionInfo: {
      Message: extractMessageFromError(error),
      ExceptionType: error.name || 'Unknown',
      StackTrace: error.stack,
      MethodName: method === null ? error.name || 'Unknown' : method[0],
    },
    TimestampUtc: `${now.getUTCFullYear()}-${
      now.getUTCMonth() + 1
    }-${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}`,
  };

  return JSON.stringify(payload);
};

exports.extractMessageFromError = extractMessageFromError;
exports.log = (error, request) => {
  try {
    if (config.dev) console.log(error);

    if (
      !error ||
      config.errordite.token === null ||
      (error.status && parseInt(error.status) < 500) ||
      (error.output && parseInt(error.output.statusCode) < 500)
    )
      return;

    if (!config.dev) console.log(error);

    // mark as logged
    error.logged = true;

    const payload = getPayload(request, error);

    const options = {
      method: 'POST',
      uri: 'https://errordite.reebonz.com/receiveerror',
      body: payload,
    };

    rp(options)
      .then((parsedBody) => {
        console.log(parsedBody);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (e) {
    console.log('Failed to send to Errordite');
    console.log(e);
  }
};
