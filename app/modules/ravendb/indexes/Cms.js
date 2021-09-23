/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Cms extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Cms', (cms) => ({
      locale: cms.locale,
      type: cms.type,
      status: cms.status,
      isActive: cms.isActive,
      updatedAt: cms.updatedAt,
      createdAt: cms.createdAt,
      path: cms.path,
      country: cms.country,
      title: cms.title,
      query: [id(cms).split('/')[1], cms.type, cms.status, cms.path, cms.country],
      patch: cms.patch,
    }));
    this.index('query', 'Search');
  }
}

module.exports = new Cms();
