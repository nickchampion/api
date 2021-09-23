/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const raven = require('../modules/ravendb');
const cache = require('../modules/cache');
const geo = require('../modules/geo');
const math = require('./math');
const Profiler = require('./profiler');

const validateCountry = (countries, isoCode) => {
  let country = countries.find((c) => c.isoCode === isoCode);

  if (country) {
    return {
      ...country,
      supported: true,
    };
  }

  country = countries.find((c) => c.isoCode === 'SG');

  return {
    ...country,
    supported: false,
  };
};

const getUser = async (credentials) => {
  if (credentials && credentials.id) {
    return cache.get(`user:${credentials.id}`, async () => {
      return raven.execute(async (s) => {
        const user = await s.get(credentials.id);
        if (user) delete user['@metadata'];
        return user;
      }, true);
    });
  }

  return credentials;
};

const utils = (countries, country) => {
  this.country = country;
  this.countries = countries;

  return {
    setCountry: (c) => {
      this.country = typeof c === 'string' || c instanceof String ? countries.find((co) => co.isoCode === c) : c;
    },
    price: (prices) => {
      return prices && prices.SG ? prices[this.country.isoCode] || prices.SG : 0;
    },
    dailyPrice: (prices) => {
      return prices && prices.SG ? math.round((prices[this.country.isoCode] || prices.SG) / 30) : 0;
    },
    packContents: (products) => {
      const prices = products.map((p) => p.prices[this.country.isoCode] || p.prices.SG);
      return math.round(_.sum(prices));
    },
    formatCurrency: (price) => {
      return this.country.format.replace('{0}', price);
    },
    formatPrice: (prices) => {
      return prices && prices.SG ? this.country.format.replace('{0}', prices[this.country.isoCode] || prices.SG) : null;
    },
    formatDailyPrice: (prices) => {
      return prices && prices.SG ? this.country.format.replace('{0}', math.round((prices[this.country.isoCode] || prices.SG) / 30)) : null;
    },
    formatPackPrice: (prices, size) => {
      return prices && prices.SG ? this.country.format.replace('{0}', math.round((prices[this.country.isoCode] || prices.SG) * size)) : null;
    },
    formatPackContents: (products) => {
      const prices = products.map((p) => p.prices[this.country.isoCode] || p.prices.SG);
      return this.country.format.replace('{0}', math.round(_.sum(prices)));
    },
  };
};

const createFromRequest = async (request) => {
  const countries = await geo.getCountries();
  const accountCountry = request.auth.credentials ? request.auth.credentials.country : null;
  const country = await validateCountry(
    countries,
    (accountCountry || request.headers['z-country'] || request.headers['cf-ipcountry'] || 'SG').toUpperCase(),
  );
  const ctx = {
    request,
    countries,
    user: await getUser(request.auth.credentials),
    authenticated: request.auth.credentials !== undefined,
    timezone: request.headers['z-timezone-offset'] ? parseInt(request.headers['z-timezone-offset']) : -480,
    country,
    clientIpAddress: request.headers['x-forwarded-for'] || request.headers['cf-connecting-ip'] || request.info._remoteAddress,
    query: request.query,
    payload: request.payload,
    params: request.params,
    locale: request.i18n.locale,
    url: request.url,
    headers: {
      request: request.headers,
      cart: request.headers['cart-token'],
      userAgent: request.headers['user-agent'],
      impersonator: request.headers['z-impersonator'],
    },
    userHasRole: (role) => {
      if (!request.auth || !request.auth.credentials) return false;
      return request.auth.credentials.scope.includes(role);
    },
    localise: request.i18n.__,
    profiler: new Profiler(),
    utils: utils(countries, country),
  };

  ctx.session = new raven.Session(ctx);
  return ctx;
};

const createFromUser = async (user, options, session) => {
  const countries = await geo.getCountries();
  const country = await validateCountry(user.country || 'SG');
  const ctx = {
    user,
    authenticated: false,
    timezone: user.timezone || -480,
    country,
    clientIpAddress: null,
    query: {},
    payload: {},
    params: {},
    locale: 'en',
    url: null,
    headers: {},
    userHasRole: (role) => {
      return user.roles.includes(role);
    },
    localise: (s) => s,
    profiler: new Profiler(),
    utils: utils(countries, country),
  };

  if (session) session.context = ctx;
  ctx.session = session || new raven.Session(ctx);

  return {
    ...ctx,
    ...(options || {}),
  };
};

module.exports = {
  createFromRequest,
  createFromUser,
};
