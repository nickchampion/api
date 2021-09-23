const geo = require('../geo');
const math = require('../../utils/math');

const convert = async (prices) => {
  if (!prices || !prices.SG) return;

  const countries = await geo.getCountries();

  Object.keys(prices).forEach(async (countryIso) => {
    if (prices[countryIso] === 0) {
      const country = countries.find((c) => c.isoCode === countryIso);

      if (country && country.exchangeRate && country.exchangeRate > 0) {
        prices[countryIso] = math.roundUp(prices.SG * country.exchangeRate);
      }
    }
  });
};

module.exports = {
  convert,
};
