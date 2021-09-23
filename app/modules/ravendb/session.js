/* eslint-disable no-await-in-loop */
const Boom = require('@hapi/boom');
const _ = require('lodash');
const { tryExecuteAsync, copy } = require('../../utils/common');
const store = require('./store');
const utils = require('./utils');

const excludedQueryFields = ['filter', 'limit', 'offset', 'q', 'orderBy'];

class Session {
  constructor(context) {
    this.context = context;
    this.documentStore = store;
    this.commitActions = [];
    this.rollbackActions = [];
    this.database = store.openSession();
    this.veto = false;
    this.commitOnGet = false; // used by get requests to indicate we want to save the session, usually we dont store anything from a get
  }

  addCommitAction(action) {
    this.commitActions.push(action);
  }

  async reset(delay) {
    if (delay) await utils.sleep(delay);

    this.database = store.openSession();
    this.commitActions = [];
    this.rollbackActions = [];
  }

  async commit() {
    if (this.veto || this.database === null) return;

    try {
      // attempt to save the session to the database
      if (this.context && this.context.profiler) await this.context.profiler.measure('sc', async () => this.database.saveChanges());
      else await this.database.saveChanges();
    } catch (e) {
      // if the commit fails execute any rollback actions
      if (this.rollbackActions.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const action of this.rollbackActions) {
          // eslint-disable-next-line no-await-in-loop
          await tryExecuteAsync(() => action(this), true, false, {
            url: this.context ? this.context.url : 'background',
          });
        }
      }
      throw e;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const action of this.commitActions) {
      // eslint-disable-next-line no-await-in-loop
      await tryExecuteAsync(() => action(this), true, false, {
        url: this.context ? this.context.url : 'background',
      });
    }

    this.commitActions = [];
    this.rollbackActions = [];
    this.database = null;
  }

  async stream(qry, map) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const s = await this.database.advanced.stream(qry);
        const records = [];

        s.on('data', (data) => {
          records.push(map ? map(data) : data.document);
        });

        s.on('error', (err) => {
          reject(err);
        });

        s.on('end', async () => {
          resolve(records);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /*
  Try to execute some code within a retry loop to handle cases where we might get concurrency issues
  */
  // eslint-disable-next-line consistent-return
  async try(action, retries, delay) {
    for (let i = 1; i <= retries; i += 1) {
      try {
        const response = await action();
        await this.commit();
        return response;
      } catch (e) {
        if (e.name && e.name === 'ConcurrencyException') {
          // throw if we've exhausted our retries
          if (i === retries) throw e;

          // reset the session and let the loop try the action again
          await this.reset(delay);
        } else {
          throw e;
        }
      }
    }
  }

  /*
  Here we deep clone the entity first so any downstream changes to the object dont affect whats in the DB
  */
  async storeAndClone(source) {
    const cloned = _.cloneDeep(source);
    await this.database.store(cloned);
    source.id = cloned.id;
  }

  async store(source) {
    await this.database.store(source);
  }

  async patch(patch, beforePatch) {
    if (patch && patch.id) {
      const doc = await this.database.load(patch.id);

      if (doc) {
        if (beforePatch) await beforePatch(doc);

        copy(patch, doc);
        return doc;
      }
    }

    throw Boom.badRequest('COMMON_NOT_FOUND', ['Patch', 'Document']);
  }

  async get(id, includes, doNotApplyIncludes) {
    let doc;

    if (includes) {
      let r = this.database;
      Object.keys(includes).forEach((key) => {
        r = r.include(includes[key]);
      });
      doc = await r.load(id);
    } else {
      doc = await this.database.load(id);
    }

    if (doc && includes && !doNotApplyIncludes) {
      // we're modifying with includes so we should never be saving back to the DB after this, so evict
      this.database.advanced.evict(doc);

      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(includes)) {
        doc[key] = doc[includes[key]] ? await this.get(doc[includes[key]]) : null;
      }
    }

    return doc;
  }

  async getWithEviction(id, includes, doNotApplyIncludes) {
    const doc = await this.get(id, includes, doNotApplyIncludes);

    if (doc) {
      this.database.advanced.evict(doc);
      return doc;
    }

    return null;
  }

  async delete(model) {
    if (!model) return;
    await this.database.delete(model);
  }

  async search(indexOrModel, includes, predicate) {
    let query = this.baseQuery(indexOrModel);

    if (this.context.query) {
      Object.keys(this.context.query)
        .filter((k) => !excludedQueryFields.includes(k))
        .forEach((key) => {
          query = utils.query.whereEquals(query, key, utils.fullyQualifyId(key, this.context.query[key]));
        });
    }

    if (this.context.query.q) {
      const queryField = indexOrModel.getQueryField();

      if (queryField) {
        query.hasFilter = true;
        query = query.search(queryField, this.context.query.q, 'AND');
      }
    }

    if (this.context.query && this.context.query.filter) query = utils.filter(this.context, query);

    if (predicate) predicate(query);

    if (includes) {
      Object.keys(includes).forEach((key) => {
        query = query.include(includes[key]);
      });
    }

    if (this.context.query && this.context.query.orderBy)
      query =
        this.context.query.orderBy[0] === '-'
          ? query.orderByDescending(this.context.query.orderBy.substr(1))
          : query.orderBy(this.context.query.orderBy);

    const r = await utils.page(query, this.context);

    // map any includes to the specified fields
    if (includes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const result of r.results) {
        // we're modifying with includes so we should never be saving back to the DB after this, so evict
        this.database.advanced.evict(result);

        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(includes)) {
          result[key] = await this.get(result[includes[key]]);
        }
      }
    }

    return r;
  }

  // #region model specific query helpers

  baseQuery(Model, filters) {
    let query = this.database.query({
      indexName: Model.getIndexName(),
    });

    if (filters) {
      Object.keys(filters).forEach((key) => {
        query = utils.query.whereEquals(query, key, filters[key]);
      });
    }

    return query;
  }

  products(filters) {
    return this.baseQuery(Session.models.Product, filters);
  }

  consultations(filters) {
    return this.baseQuery(Session.models.Consultation, filters);
  }

  orders(filters) {
    return this.baseQuery(Session.models.Order, filters);
  }

  refunds(filters) {
    return this.baseQuery(Session.models.Refund, filters);
  }

  reviews(filters) {
    return this.baseQuery(Session.models.Review, filters);
  }

  subscriptions(filters) {
    return this.baseQuery(Session.models.Subscription, filters);
  }

  images(filters) {
    return this.baseQuery(Session.models.Image, filters);
  }

  cms(filters) {
    return this.baseQuery(Session.models.Cms, filters);
  }

  credits(filters) {
    return this.baseQuery(Session.models.Credit, filters);
  }

  creditsByUser(userId) {
    return this.baseQuery(
      {
        getIndexName: () => 'CreditsByUser',
      },
      { userId },
    );
  }

  packs(filters) {
    return this.baseQuery(Session.models.Pack, filters);
  }

  barcodes(filters) {
    return this.baseQuery(Session.models.Barcode, filters);
  }

  carts(filters) {
    return this.baseQuery(Session.models.Cart, filters);
  }

  alerts(filters) {
    return this.baseQuery(Session.models.Alert, filters);
  }

  audits(filters) {
    return this.baseQuery(Session.models.Audit, filters);
  }

  medication(filters) {
    return this.baseQuery(Session.models.Medication, filters);
  }

  users(filters) {
    return this.baseQuery(Session.models.User, filters);
  }

  guidance(filters) {
    return this.baseQuery(Session.models.Guidance, filters);
  }

  food(filters) {
    return this.baseQuery(Session.models.Food, filters);
  }

  specifiers(filters) {
    return this.baseQuery(Session.models.Specifier, filters);
  }

  surveyQuestions(filters) {
    return this.baseQuery(Session.models.SurveyQuestions, filters);
  }

  surveys(filters) {
    return this.baseQuery(Session.models.Survey, filters);
  }

  discounts(filters) {
    return this.baseQuery(Session.models.Discount, filters);
  }

  labResults(filters) {
    return this.baseQuery(Session.models.LabResult, filters);
  }

  feedback(filters) {
    return this.baseQuery(Session.models.Feedback, filters);
  }

  static setModels(models) {
    Session.models = models;
  }

  // #endregion
}

module.exports = Session;
