const Base = require('./Base');

class Cart extends Base {
  id
  token = null
  currency = null
  orderTotal = 0
  discountTotal = 0
  shippingTotal = 0
  subTotal = 0
  country = null
  userId = null
  items = null
  discounts = null
  discountCode = null
  shippingMethodId = null
  paymentProvider = null
  createdAt = null
  updatedAt = null
  sendCount = null
  sentReminderAt = null
  patch = null

  constructor(cart) {
    super('Carts', 'carts');
    this.merge(this, cart);
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `carts/${id}` : id;
  }

  static getIndexName() {
    return 'Carts';
  }
}

module.exports = Cart;
