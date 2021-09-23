/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Merchants extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Merchants', (merchant) => ({
      name: merchant.name,
      status: merchant.status,
      query: [merchant.name, merchant.type, id(merchant).split('/')[1]],
      patch: merchant.patch,
    }));
    this.index('query', 'Search');
  }
}

module.exports = new Merchants();
