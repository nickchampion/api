const { parseStream } = require('fast-csv');
const raven = require('../ravendb');
const common = require('../../utils/common');

const parse = async (request) => {
  const result = [];

  return new Promise((resolve, reject) => {
    parseStream(request.payload.file, { headers: true, delimiter: ',' })
      .transform((data) => ({
        id: raven.Models.Product.getId(data.id),
        inventory: parseInt(data.inventory),
      }))
      .on('error', (error) => reject(error))
      .on('data', (row) => result.push(row))
      .on('end', () => resolve(result));
  });
};

const processBatch = async (batch) => {
  const session = raven.store.openSession();
  const products = await session.load(batch.map((b) => b.id));

  batch.forEach((product) => {
    const p = Object.prototype.hasOwnProperty.call(products, product.id) ? products[product.id] : null;

    if (p) {
      p.inventory = product.inventory;
      p.updatedAt = new Date().toISOString();
    }
  });

  await session.saveChanges();
};

const process = async (data) => {
  await Promise.all(common.partition(data, 20).map((b) => processBatch(b)));

  return {
    total: data.length,
  };
};

module.exports = {
  parse,
  process,
};
