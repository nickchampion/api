/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Bundles extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Bundles', (bundle) => ({
      status: bundle.status,
      sellerId: bundle.sellerId,
      slug: bundle.slug,
      query: [bundle.slug, id(bundle).split('/')[1]],
      patch: bundle.patch,
    }));

    this.index('query', 'Search');
  }
}

module.exports = new Bundles();
