const raven = require('.');
const migrations = require('./migrations');

const bootstrap = async () => {
  await migrations.run();
  // eslint-disable-next-line no-console
  await Promise.all(Object.keys(raven.Indexes).map((key) => raven.Indexes[key].execute(raven.store).catch((e) => console.log(e))));
};

module.exports = bootstrap;
