/* eslint-disable no-undef */
const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Alerts extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Alerts', (alert) => ({
      type: alert.type,
      description: alert.description,
      status: alert.status,
      query: [alert.status, alert.description, alert.type, id(alert.id).split('/')[1]],
      patch: alert.patch,
    }));
    this.index('query', 'Search');
  }
}

module.exports = new Alerts();
