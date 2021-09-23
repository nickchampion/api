/* eslint-disable no-unused-vars */
const Boom = require('@hapi/boom');

class RavenController {
  constructor(model, index, map, mapMany, mapWithContext = false, includes) {
    this.Model = model;
    this.map = map;
    this.mapMany = mapMany;
    this.index = index;
    this.mapWithContext = mapWithContext;
    this.includes = includes;
  }

  async get(request) {
    const doc = await request.context.session.get(this.Model.getId(request.params.id));
    return this.afterGet(request.context, doc);
  }

  async query(request) {
    this.beforeQuery(request.context);
    const page = await request.context.session.search(this.Model, this.includes);
    page.results = this.mapMany ? (this.mapWithContext ? this.mapMany(request.context, page.results) : this.mapMany(page.results)) : page.results;
    await this.afterQuery(page, request.context);
    return page;
  }

  async create(request) {
    const doc = new this.Model(request.payload);

    await this.beforeCreate(doc, request.context);
    await request.context.session.store(doc);
    await this.afterCreate(doc, request.context);

    return this.map ? (this.mapWithContext ? this.map(request.context, doc) : this.map(doc)) : doc;
  }

  async patch(request) {
    const patch = {
      ...request.payload,
      id: this.Model.getId(request.params.id),
    };

    const updated = await request.context.session.patch(patch, async (dbDocument) => {
      await this.beforePatch(patch, dbDocument, request.context);
    });

    await this.afterPatch(updated, request.context);

    return this.map ? (this.mapWithContext ? this.map(request.context, updated) : this.map(updated)) : updated;
  }

  async delete(request) {
    const doc = await request.context.session.get(this.Model.getId(request.params.id));

    if (doc) {
      await this.beforeDelete(doc, request.context);
      await request.context.session.delete(doc);
      await this.afterDelete(doc, request.context);
    }

    return {
      success: true,
    };
  }

  async afterGet(context, doc) {
    if (!doc) throw Boom.notFound();

    // optional, can be implemented in derived class to modify the doc after retrieval
    return this.map ? (this.mapWithContext ? this.map(context, doc) : this.map(doc)) : doc;
  }

  async beforeQuery(context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async afterQuery(results, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async beforeCreate(model, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async afterCreate(model, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async beforePatch(model, databaseModel, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async afterPatch(model, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async beforeDelete(model, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }

  async afterDelete(model, context) {
    // optional, can be implemented in derived class to modify the model before we create it
  }
}

module.exports = RavenController;
