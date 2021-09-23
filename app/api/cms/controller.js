const Boom = require('@hapi/boom');
const _ = require('lodash');
const RavenController = require('../RavenController');
const map = require('../../modules/map');
const raven = require('../../modules/ravendb');
const cms = require('../../modules/cms');
const cache = require('../../modules/cache');
const Audit = require('../../modules/audit');
const config = require('../../modules/configuration').config();
const { AUDIT_EVENTS } = require('../../constants');

class CmsController extends RavenController {
  constructor() {
    super(raven.Models.Cms, raven.Indexes.Cms, map.cms, map.cmss);
  }

  async getByPath(context, path, country, existingId) {
    const docs = await context.session.cms({ path, country }).selectFields(['id', 'path']).all();
    return existingId ? docs.filter((d) => d.id !== existingId) : docs;
  }

  async publish(request) {
    return cms.publish(request.context);
  }

  async sync(request) {
    const result = await cms.sync(request.context);
    if (result.cacheKey) cache.del(result.cacheKey);
    return result;
  }

  async afterCreate(model) {
    cache.del(`cms:${model.path}:${model.locale}`);
  }

  async beforeCreate(model, context) {
    if (config.production) throw Boom.badRequest('Cannot create CMS content in live, please publish from staging');

    if (model.path) model.path = model.path.trim();

    const existing = await this.getByPath(context, model.path, model.country);

    if (existing.length > 0)
      throw Boom.badRequest(`Path ${model.path} already exists in the database, please use unique paths. Existing Id: ${existing[0].id}`);

    model.updatedBy = context.user.id;
    model.createdAt = new Date().toISOString();
    model.updatedAt = new Date().toISOString();
  }

  async beforePatch(model, databaseModel, context) {
    if (config.production) throw Boom.badRequest('Cannot create CMS content in live, please publish from staging');

    model.updatedBy = context.user.id;

    if (model.path) model.path = model.path.trim();

    const existing = await this.getByPath(context, model.path, model.country, databaseModel.id);

    if (existing.length > 0)
      throw Boom.badRequest(`Path ${model.path} already exists in the database, please use unique paths. Existing Id: ${existing[0].id}`);

    model.updatedBy = context.user.id;

    switch (model.status) {
      case 'published':
        model.publishedAt = new Date().toISOString();
        model.updatedAt = new Date().toISOString();
        break;
      case 'draft':
        model.publishedAt = null;
        model.updatedAt = new Date().toISOString();
        break;
      default:
        model.updatedAt = new Date().toISOString();
        break;
    }

    // audit so we can keep a history of changes
    await new Audit(AUDIT_EVENTS.Cms_Update)
      .withMessage(`CMS document updated > ${model.path} > ${model.type}`)
      .withReferenceId(databaseModel.id)
      .withData(_.cloneDeep(databaseModel))
      .withUser(context.user.id)
      .withEmail(context.user.email)
      .store(context.session);
  }

  async afterPatch(model) {
    cache.del(`cms:${model.path}:${model.locale}`);
  }

  async beforeDelete(model, context) {
    await new Audit(AUDIT_EVENTS.Cms_Delete)
      .withMessage(`CMS document deleted > ${model.path} > ${model.type}`)
      .withReferenceId(model.id)
      .withData(model)
      .withUser(context.user.id)
      .withEmail(context.user.email)
      .store(context.session);
  }

  async afterDelete(model) {
    cache.del(`cms:${model.path}:${model.locale}`);
  }
}

module.exports = CmsController;
