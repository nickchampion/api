const Base = require('./Base');

class Alert extends Base {
  id
  type = null
  description = null
  data = null
  status = null
  createdAt = null
  dismissedAt = null
  patch = null

  constructor(alert) {
    super('Alerts', 'alerts');
    this.merge(this, alert);
  }

  static getQueryField() {
    return 'description';
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `alerts/${id}` : id;
  }

  static getIndexName() {
    return 'Alerts';
  }
}

module.exports = Alert;
