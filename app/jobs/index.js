/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const cron = require('node-cron');
const moment = require('moment');
const { PutCompareExchangeValueOperation, DeleteCompareExchangeValueOperation } = require('ravendb');
const config = require('../modules/configuration').config();
const raven = require('../modules/ravendb');
const { tryExecuteAsync } = require('../utils/common');

const releaseLock = async (name, index) => {
  await raven.store.operations.send(new DeleteCompareExchangeValueOperation(name, index));
};

/*
Here we need a cluster wide lock so we can be sure no 2 processes run the job
*/
const acquireLock = async (name) => {
  const now = new Date();

  const doc = {
    reserveUntil: moment().add(3, 'h').toDate(),
  };

  const result = await raven.store.operations.send(new PutCompareExchangeValueOperation(name, doc, 0));

  if (result && result.successful) return result.index;

  if (result.value.reserveUntil < now) {
    // Time expired - Update the existing key with the new value
    const takeLockWithTimeoutResult = await raven.store.operations.send(new PutCompareExchangeValueOperation(name, doc, result.index));

    if (takeLockWithTimeoutResult.successful) return takeLockWithTimeoutResult.index;
  }

  return -1;
};

const executeJob = async (name, job) => {
  await tryExecuteAsync(
    async () => {
      // need to lock this process so its only executed on one instance of node
      const index = await acquireLock(job.lockName);

      // some other process has the job lock so exit
      if (index === -1) return;

      try {
        await require(`./jobs/${name}`)();
      } finally {
        await releaseLock(job.lockName, index);
      }
    },
    true,
    false,
    {
      name: `JOB:${name}`,
    },
  );
};

module.exports.schedule = () => {
  Object.keys(config.jobs).forEach((name) => {
    const job = config.jobs[name];
    cron.schedule(job.schedule, () => executeJob(name, job));
  });
};
