/* eslint-disable no-await-in-loop */
const moment = require('moment');
const { IndexQuery, DeleteByQueryOperation } = require('ravendb');
const raven = require('../../modules/ravendb');
const { SINGLETONS, SURVEY_STATUS } = require('../../constants');

const surveyQuestions = async () => {
  const session = new raven.Session();
  session.database.maxNumberOfRequestsPerSession = 5000;
  const surveys = Object.keys((await session.get(SINGLETONS.Surveys)).surveys);

  for (let i = 0; i < surveys.length; i += 1) {
    const questions = await session.surveyQuestions({ surveygizmo_id: surveys[i] }).orderByDescending('createdAt').all();

    // skip the first result as this is the active set of questions
    for (let j = 1; j < questions.length; j += 1) {
      const usedCount = await session.surveys({ surveyQuestionsId: questions[j].id }).whereNotEquals('status', SURVEY_STATUS.Complete).count();

      // essentially if there are no pending or partial surveys using these questions we can delete them
      if (usedCount === 0) {
        await session.delete(questions[j]);
      }
    }
  }

  await session.commit();
};

const surveys = async () => {
  const session = new raven.Session();

  // delete any partial survey thats more than a week old
  let date = moment.utc(new Date()).add(-7, 'days').toISOString();
  let indexQuery = new IndexQuery();
  indexQuery.query = `from index 'Surveys' where status = 'Pending' and createdAt < '${date}'`;
  let operation = new DeleteByQueryOperation(indexQuery, {
    allowStale: true,
  });
  let asyncOp = await session.documentStore.operations.send(operation);
  await asyncOp.waitForCompletion();

  // delete any pending survey thats more than 1 months old
  date = moment.utc(new Date()).add(-1, 'months').toISOString();
  indexQuery = new IndexQuery();
  indexQuery.query = `from index 'Surveys' where status = 'Partial' and createdAt < '${date}'`;
  operation = new DeleteByQueryOperation(indexQuery, {
    allowStale: true,
  });
  asyncOp = await session.documentStore.operations.send(operation);
  await asyncOp.waitForCompletion();

  // delete any pending survey thats more than 7 days old with no email address
  date = moment.utc(new Date()).add(-7, 'days').toISOString();
  indexQuery = new IndexQuery();
  indexQuery.query = `from index 'Surveys' where status = 'Partial' and createdAt < '${date}' and email = null`;
  operation = new DeleteByQueryOperation(indexQuery, {
    allowStale: true,
  });
  asyncOp = await session.documentStore.operations.send(operation);
  await asyncOp.waitForCompletion();
};

// const zestteeData = async () => {
//   let session = new raven.Session();
//   const u = await session.users().search('email', '*@zesttee.com').all();

//   for (let i = 0; i < u.length; i += 1) {
//     session = new raven.Session();
//     session.database.maxNumberOfRequestsPerSession = 5000;
//     await users.hardDelete(
//       {
//         session,
//       },
//       u[i].id,
//       true,
//     );
//     await session.commit();
//   }
// };

// const carts = async () => {
//   const session = new raven.Session();

//   const date = moment.utc().add(-14, 'days');
//   const cartsToDelete = await session.carts().whereLessThan('updatedAt', date).whereEquals('userId', null).take(1024).all();
//   const customPacks = cartsToDelete.map((c) => c.items);
// };

module.exports = async () => {
  await surveys();
  await surveyQuestions();

  // clean up live test data
  // if (config.production) await zestteeData();
};
