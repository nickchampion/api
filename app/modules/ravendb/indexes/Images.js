const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Images extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Images', (img) => ({
      type: img.type,
      linkedTo: img.linkedTo,
      size: img.size,
      url: img.url,
      deleted: img.deleted,
      name: img.query,
      patch: img.patch,
    }));

    this.index('query', 'Search');
  }
}

module.exports = new Images();
