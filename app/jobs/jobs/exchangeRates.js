const axios = require('axios').default;
const errordite = require('../../modules/errordite');
const raven = require('../../modules/ravendb');
const { SINGLETONS } = require('../../constants');

module.exports = async () => {
  try {
    const response = await axios.get('https://v6.exchangerate-api.com/v6/b3ff7017866714f502a544d2/latest/SGD');
    const session = new raven.Session();
    const countries = await session.database.load(SINGLETONS.Countries);

    countries.countries.forEach((country) => {
      country.exchangeRate = Object.prototype.hasOwnProperty.call(response.data.conversion_rates, country.currency)
        ? response.data.conversion_rates[country.currency]
        : -1;
    });

    await session.commit();
  } catch (e) {
    e.name = 'ExchangeRates';
    errordite.log(e);
  }
};
