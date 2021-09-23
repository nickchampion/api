/* eslint-disable global-require */
const _ = require('lodash');

// add ping route by default for health check
const routes = [
  require('./audit/routes'),
  require('./categories/routes'),
  require('./cms/routes'),
  require('./dashboard/routes'),
  require('./discounts/routes'),
  require('./identity/routes'),
  require('./orders/routes'),
  require('./products/routes'),
  require('./refunds/routes'),
  require('./shipping/routes'),
  require('./stripe/routes'),
  require('./test/routes'),
  require('./upload/routes'),
  require('./users/routes'),
  require('./utils/routes'),
];

// export routes
module.exports = _.flattenDeep(routes);
