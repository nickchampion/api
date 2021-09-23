const raven = require('../ravendb');
const cache = require('../cache');
const map = require('../map');
const geo = require('../geo');
const common = require('../../utils/common');
const { CACHE_KEYS } = require('../../constants');

const get = async (userId) => {
  return (
    (await cache.get(common.format(CACHE_KEYS.AddressBook, raven.utils.friendlyId(userId)), async () => {
      const session = new raven.Session();
      const addressBook = await session.get(raven.Models.AddressBook.getId(userId));

      if (addressBook) {
        const countries = await geo.getCountries();
        return map.addresses(addressBook.addresses, countries);
      }

      return null;
    })) || []
  );
};

const getById = async (userId, id) => {
  const addresses = await get(userId);
  return addresses.find((a) => a.id === id);
};

module.exports = {
  get,
  getById,
};
