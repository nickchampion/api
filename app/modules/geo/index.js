const { WebServiceClient } = require('@maxmind/geoip2-node');
const raven = require('../ravendb');
const cache = require('../cache');
const config = require('../configuration').config();

const maxMind = new WebServiceClient(config.maxMind.accountNumber, config.maxMind.licenseKey);
const { SINGLETONS } = require('../../constants');

const getCountries = async () =>
  cache.get('countries', async () => {
    const session = new raven.Session();
    return (await session.get(SINGLETONS.Countries)).countries;
  });

const getCountry = async (isoCode) => {
  const countries = await getCountries();
  return countries.find((c) => c.isoCode === isoCode.toUpperCase() || c.name.toLowerCase() === isoCode.toLowerCase());
};

const getCountryByPhone = async (phone) => {
  const countries = await getCountries();
  return countries.find((c) => phone.startsWith(c.phone));
};

const getGeoLocation = async (context, phone, countryIsoCode) => {
  try {
    if (countryIsoCode) {
      const c = await getCountry(countryIsoCode);
      if (c) return c;
    }

    if (phone) {
      const c = await getCountryByPhone(phone);
      if (c) return c;
    }

    const ip = context.query && context.query.ip ? context.query.ip : context.clientIpAddress;
    const geoLookup = await maxMind.country(ip);
    const country = await getCountry(geoLookup.country.isoCode);
    return country || (await getCountry('SG'));
  } catch (e) {
    return getCountry('SG');
  }
};

module.exports = {
  getGeoLocation,
  getCountries,
  getCountry,
};
