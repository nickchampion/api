/* eslint-disable global-require */
// ordering of exports is important otherwise we'll get cyclic dependency issues

module.exports.Models = {
  AddressBook: require('./models/AddressBook'),
  Alert: require('./models/Alert'),
  Audit: require('./models/Audit'),
  Bundle: require('./models/Bundle'),
  Cart: require('./models/Cart'),
  Cms: require('./models/Cms'),
  Discount: require('./models/Discount'),
  Image: require('./models/Image'),
  Merchant: require('./models/Merchant'),
  Order: require('./models/Order'),
  Product: require('./models/Product'),
  Refund: require('./models/Refund'),
  Seller: require('./models/Seller'),
  User: require('./models/User'),
};

module.exports.Indexes = {
  Alerts: require('./indexes/Alerts'),
  Audits: require('./indexes/Audit'),
  Bundles: require('./indexes/Bundles'),
  Carts: require('./indexes/Carts'),
  Cms: require('./indexes/Cms'),
  Discounts: require('./indexes/Discounts'),
  Images: require('./indexes/Images'),
  Merchants: require('./indexes/Merchants'),
  Orders: require('./indexes/Orders'),
  Products: require('./indexes/Products'),
  Refunds: require('./indexes/Refunds'),
  Sellers: require('./indexes/Sellers'),
  Users: require('./indexes/Users'),
};

module.exports.store = require('./store');
module.exports.Session = require('./session');

module.exports.Session.setModels(module.exports.Models);
module.exports.utils = require('./utils');

// simple helper to execute some code within a session and commit the session
module.exports.execute = async (action, skipCommit) => {
  const session = new module.exports.Session();
  const result = await action(session);
  if (!skipCommit) await session.commit();
  return result;
};
