const { DocumentStore } = require('ravendb');
const config = require('../configuration').config();
const { Models } = require('./index');

const initialize = () => {
  // NOTE: when encrypting a certificate PEM file make sure there are no spaces / tabs to the left of the text as this causes an error
  const authOptions = {
    certificate: config.ravendb.certificate,
    type: 'pem',
  };

  const endpoints = config.ravendb.endpoints.split('|');
  const docStore = new DocumentStore(endpoints, config.ravendb.databaseName, authOptions);

  Object.keys(Models).forEach((key) => {
    docStore.conventions.registerEntityType(Models[key]);
  });

  docStore.conventions.useOptimisticConcurrency = true;
  docStore.conventions.findCollectionNameForObjectLiteral = (entity) => entity.collection;
  docStore.initialize();

  // eslint-disable-next-line no-console
  console.log(`RavenDB: Successfully connected to ${config.ravendb.endpoints}:${config.ravendb.databaseName}`);
  return docStore;
};

module.exports = initialize();
