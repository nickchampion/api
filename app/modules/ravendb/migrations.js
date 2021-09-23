/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */
const moment = require('moment');
const { PutCompareExchangeValueOperation, DeleteCompareExchangeValueOperation } = require('ravendb');
const raven = require('.');
const errordite = require('../errordite');

const release = async (index) => {
  await raven.store.operations.send(new DeleteCompareExchangeValueOperation('Migrations/Lock', index));
};

const loadMigrations = () => {
  const path = require('path').join(__dirname, 'migrations');
  const migrations = [];
  require('fs')
    .readdirSync(path)
    .forEach((file) => {
      migrations.push({
        func: require(`./migrations/${file}`),
        name: file,
      });
    });
  return migrations;
};

const doMigration = async () => {
  const session = raven.store.openSession();
  let registry = await session.load('MigrationRegistry');

  if (!registry) {
    registry = {
      id: 'MigrationRegistry',
      collection: 'Singletons',
      scripts: {},
    };
    await session.store(registry);
  }

  const migrations = loadMigrations();

  // eslint-disable-next-line no-restricted-syntax
  for (const migration of migrations) {
    try {
      if (!Object.prototype.hasOwnProperty.call(registry.scripts, migration.name)) {
        await migration.func.execute(raven.store);
        registry.scripts[migration.name] = 'ok';
      }
    } catch (e) {
      registry.scripts[migration.name] = e.toString();
      errordite.log(e);
    }
  }

  await session.saveChanges();
};

/*
Here we need a cluster wide lock so we can be sure no 2 processes run the migrations
*/
const lock = async () => {
  const now = new Date();

  const doc = {
    reserveUntil: moment().add(3, 'h').toDate(),
  };

  const result = await raven.store.operations.send(new PutCompareExchangeValueOperation('Migrations/Lock', doc, 0));

  if (result && result.successful) return result.index;

  if (result.value.reserveUntil < now) {
    // Time expired - Update the existing key with the new value
    const takeLockWithTimeoutResult = await raven.store.operations.send(new PutCompareExchangeValueOperation('Migrations/Lock', doc, result.index));

    if (takeLockWithTimeoutResult.successful) return takeLockWithTimeoutResult.index;
  }

  return -1;
};

const run = async () => {
  const index = await lock();

  if (index === -1) return; // some other process has the migration lock so exit

  try {
    console.log('Start migrations...');
    await doMigration();
    await release(index);
    console.log('Complete migrations...');
  } catch (e) {
    console.log('Migrations failed');
    errordite.log(e);
    await release(index);
  }
};

const patch = async (index, filter, apply, patchToken) => {
  const results = true;

  while (results) {
    const session = raven.store.openSession();

    // wait for indexing after each session save
    session.advanced.waitForIndexesAfterSaveChanges({
      indexes: [index],
      throwOnTimeout: false,
      timeout: 120000,
    });

    const query = filter(session.query({ indexName: index }))
      .whereNotEquals('patch', patchToken)
      .take(1024);

    const docs = await query.all();

    if (docs && docs.length > 0) {
      docs.forEach((doc) => {
        apply(doc);
        doc.patch = patchToken;
      });

      await session.saveChanges();
    } else {
      break;
    }
  }
};

module.exports = {
  run,
  patch,
};
