/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Sellers extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Sellers', (seller) => ({
      name: seller.name,
      status: seller.status,
      query: [seller.name, seller.type, id(seller).split('/')[1]],
      patch: seller.patch,
    }));

    this.index('query', 'Search');
  }
}

module.exports = new Sellers();
