const Base = require('./Base');

class AddressBook extends Base {
  id
  userId = null
  addresses = []
  currentId = 0

  constructor(address) {
    super(null, 'AddressBooks');
    this.merge(this, address);
  }

  getId(id) {
    return AddressBook.getId(id);
  }

  static getId(id) {
    if (id && id.toLowerCase().indexOf('addressbooks') !== -1) 
      return id;

    if (id && id.toLowerCase().indexOf('users') !== -1) 
      return `AddressBooks/${id.split('/')[1]}`;

    return `AddressBooks/${id}`;
  }
}

module.exports = AddressBook;
