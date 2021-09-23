const _ = require('lodash');
const { PRODUCT_TYPES } = require('../constants');

const extractItemId = (item) => {
  return item.type === PRODUCT_TYPES.Supplement || item.type === PRODUCT_TYPES.TestKit || item.type === PRODUCT_TYPES.Unclassified
    ? item.productId
    : item.type === PRODUCT_TYPES.Medication
    ? item.medicationId
    : item.packId;
};

const extractPackIds = (items) => {
  const ids = [];

  items
    .filter((i) => i.type === PRODUCT_TYPES.Pack || i.type === PRODUCT_TYPES.CustomPack)
    .forEach((i) => {
      i.metadata.contents.forEach((p) => {
        ids.push(p.id);
      });
    });

  return _.uniq(ids);
};

const extractItemIds = (items) => {
  return items.map((i) => {
    return extractItemId(i);
  });
};

const cleanPhone = (phone) => {
  const parts = phone.split(' ');
  return `${parts[0]} ${phone.replace(parts[0], '').replace(/ /g, '').replace(/-/g, '')}`;
};

const sequence = async (promises) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const promise of promises) {
    // eslint-disable-next-line no-await-in-loop
    await promise();
  }
};

module.exports = {
  extractPackIds,
  extractItemIds,
  extractItemId,
  cleanPhone,
  sequence,
};
