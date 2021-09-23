const Base = require('./Base');

class Order extends Base {
  id
  userId = null
  merchantId = null
  sellerId = null
  eventId = null
  currency = null
  orderTotal = 0
  discountTotal = 0
  shippingTotal = 0
  subTotal = 0
  status = null
  code = null
  createdAt = null
  updatedAt = null
  discountCode = null
  cartId = null
  refundId = null
  shipping = null
  billing = null
  deliveryInstructions = null
  country = null
  payments = null
  shippingMethodId = null
  shippingType = null
  exchangeRate = null
  shipments = []
  items = []
  discounts = []
  cogs = {}
  comments = []
  patch = null

  constructor(order) {
    super('Orders', 'orders');
    this.merge(this, order);
  }

  static getId(id) {
    return id.indexOf('/') === -1 ? `orders/${id}` : id;
  }

  static getQueryField() {
    return 'query';
  }

  static getIndexName() {
    return 'Orders';
  }
}

module.exports = Order;
