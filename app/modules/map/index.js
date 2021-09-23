const products = require('./products');
const orders = require('./orders');
const taxonomy = require('./taxonomy');
const bundles = require('./bundles');
const cart = require('./cart');
const users = require('./users');
const images = require('./image');
const audit = require('./audit');
const alert = require('./alert');
const cms = require('./cms');
const address = require('./address');
const refunds = require('./refunds');
const discounts = require('./discounts');

module.exports = {
  ...products,
  ...orders,
  ...taxonomy,
  ...bundles,
  ...cart,
  ...users,
  ...images,
  ...audit,
  ...alert,
  ...cms,
  ...address,
  ...refunds,
  ...discounts,
};
