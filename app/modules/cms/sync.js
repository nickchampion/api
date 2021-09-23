const _ = require('lodash');
const { parseStream } = require('fast-csv');
const raven = require('../ravendb');
const common = require('../../utils/common');

const parse = async (request) => {
  const result = [];

  return new Promise((resolve, reject) => {
    parseStream(request.payload.file, { headers: true, delimiter: ',' })
      .transform((data) => ({
        path: data.path,
        country: data.country,
        openGraph: {
          keywords: data.keywords || null,
          description: data.description || null,
          canonical: data.path,
          title: data.title || null,
        },
      }))
      .on('error', (error) => reject(error))
      .on('data', (row) => result.push(row))
      .on('end', () => resolve(result));
  });
};

const processBatch = async (batch, context, country) => {
  const session = new raven.Session();
  const docs = await session
    .cms({ country })
    .whereIn(
      'path',
      batch.map((d) => d.path),
    )
    .all();

  batch.forEach((doc) => {
    const d = docs.find((x) => x.path === doc.path);

    if (d) {
      d.openGraph = doc.openGraph;
      d.updatedBy = context.user.id;
      d.updatedAt = new Date().toISOString();
    }
  });

  await session.commit();
};

const process = async (data, context) => {
  const countries = _.groupBy(data, (d) => d.country);

  // eslint-disable-next-line no-restricted-syntax
  for (const country of Object.keys(countries)) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(common.partition(data, 10).map((b) => processBatch(b, context, country)));
  }

  return {
    total: data.length,
  };
};

module.exports = {
  parse,
  process,
};
