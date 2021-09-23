const Boom = require('@hapi/boom');
const RavenController = require('../RavenController');
const raven = require('../../modules/ravendb');
const code = require('../../modules/discounts/code');
const map = require('../../modules/map');
const cache = require('../../modules/cache');
const { DISCOUNT_STATUS, DISCOUNT_TYPES, CACHE_KEYS } = require('../../constants');

class DiscountController extends RavenController {
  constructor() {
    super(raven.Models.Discount, raven.Indexes.Discounts, map.discount, map.discounts);
  }

  async beforeCreate(model, context) {
    this.validate(model, context);

    model.code = model.code ? model.code.toUpperCase() : null;
    model.status = DISCOUNT_STATUS.Approved;
    model.updatedByUserId = context.user.id;
    model.createdAt = new Date().toISOString();
    model.updatedAt = new Date().toISOString();
  }

  async afterCreate(model, context) {
    const codeLock = await code.reserve(model.code, model.id);

    if (!codeLock) {
      throw Boom.badRequest(`The discount code ${model.code} is already in use, please use a different code`);
    }

    // if we got a lock, add a rollback action to remove it incase the request fails
    context.session.rollbackActions.push(async () => {
      await code.release(model.code);
    });
  }

  async beforePatch(model, databaseModel, context) {
    this.validate(model, context);

    model.code = model.code ? model.code.toUpperCase() : null;

    // if we're updating the code we need to release teh previous code lock and create another one for the new code
    if (model.code !== databaseModel.code) {
      const originalCode = databaseModel.code;
      const newCode = model.code;

      // need to replace the code lock
      if (!(await code.replace(originalCode, newCode, databaseModel.id))) {
        throw Boom.badRequest(`The discount code ${newCode} is already in use, please use a different code`);
      }

      // if we successfully got a lock we need to restore the previous code lock if we get an error committing
      context.session.rollbackActions.push(async () => {
        await code.replace(newCode, originalCode, databaseModel.id);
      });
    }

    model.updatedByUserId = context.user.id;
    model.updatedAt = new Date().toISOString();
  }

  async afterPatch() {
    cache.del(CACHE_KEYS.ActiveDiscounts);
  }

  validate(model, context) {
    // extra validation checks
    context.payload.countries.forEach((c) => {
      if (model.effect.startsWith('fixed') && !c.fixedAmount)
        throw Boom.badRequest('You specified a fixed amount off discount but did not provide the fixed amount in each country setting');

      if (model.effect === DISCOUNT_TYPES.Percentage && !c.percentage)
        throw Boom.badRequest('You specified a percentage off discount but did not provide the percentage off in each country setting');

      c.country = c.country.toUpperCase();
    });
  }
}

module.exports = DiscountController;
