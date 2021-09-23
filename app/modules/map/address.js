const address = (add, countries) => {
  const country = countries.find((c) => c.isoCode === add.country.toUpperCase() || c.name.toLowerCase() === add.country.toLowerCase());

  return {
    id: add.id,
    firstName: add.firstName,
    lastName: add.lastName,
    company: add.company,
    address1: add.address1,
    address2: add.address2,
    city: add.city,
    stateName: add.stateName,
    country: country.name,
    countryIsoCode: country.isoCode,
    zipcode: add.zipcode,
    phone: add.phone,
    isDefault: add.isDefault,
  };
};

const addresses = (addresss, countries) => {
  return addresss.map((i) => address(i, countries));
};

module.exports = {
  addresses,
  address,
};
