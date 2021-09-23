const _ = require('lodash');
const raven = require('../ravendb');
const cache = require('../cache');

const getSingleton = async (id, ttl) => {
  return cache.get(
    `singleton:${id}`,
    async () => {
      const session = new raven.Session();
      return session.database.load(id);
    },
    ttl,
  );
};

module.exports = {
  getSingleton,
};
