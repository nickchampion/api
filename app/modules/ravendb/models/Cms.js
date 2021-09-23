const Base = require('./Base');

class Cms extends Base {
  id
  locale = null
  country = null
  title = null
  openGraph = null
  type = null
  content = null
  status = null
  publishedAt = null
  isActive = null
  createdAt = null
  updatedAt = null
  path = null
  updatedBy = null
  patch = null

  constructor(cms) {
    super('Cms', 'cms');
    this.merge(this, cms);
  }

  static getQueryField() {
    return 'query';
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `cms/${id}` : id;
  }

  static getIndexName() {
    return 'Cms';
  }
}

module.exports = Cms;
