const Base = require('./Base');

class Image extends Base {
  id
  type = null
  url = null
  name = null
  size = null
  linkedTo = []
  createdAt = null
  deleted = false
  query = null
  patch = null

  constructor(image) {
    super('Images', 'images');
    this.merge(this, image);
  }

  static getQueryField() {
    return 'name';
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `images/${id}` : id;
  }

  static getIndexName() {
    return 'Images';
  }
}

module.exports = Image;
