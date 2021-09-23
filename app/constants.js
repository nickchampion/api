/* eslint-disable no-template-curly-in-string */
const FILE_EXTENSIONS = ['jpg', 'png', 'gif', 'doc', 'pdf', 'xlsx', 'xls', 'hl7'];

const TEST_INFO = {
  Phone: '+65 98765432',
  Email: 'automated-tests@zesttee.com',
};

const ORDER_STATUS = {
  Pending: 'Pending', // waiting for customer to complete checkout, probably needs 3DS verification
  PaymentTaken: 'PaymentTaken', // we have created an authorisation, valid for 7 days
  PaymentFailed: 'PaymentFailed', // payment failed, could be fraud, no available balance, refused by bank etc, reason will be stored on order.payment
  PaymentCaptured: 'PaymentCaptured', // we've captured any authorisations
  Shipped: 'Shipped', // we've shipped items and captured payment, payment may be captured before if its an order for meds with an appointment
  Delivered: 'Delivered', // we've delivered items on an order
  Cancelled: 'Cancelled',
  ReturnPending: 'ReturnPending',
  Returned: 'Returned',
};

const SUCCESS_ORDER_STATUS = [
  ORDER_STATUS.Pending,
  ORDER_STATUS.PendingFraudCheck,
  ORDER_STATUS.ReturnPending,
  ORDER_STATUS.Shipped,
  ORDER_STATUS.Delivered,
  ORDER_STATUS.PaymentCaptured,
  ORDER_STATUS.PaymentTaken,
];

const FAILURE_ORDER_STATUS = [ORDER_STATUS.PaymentFailed, ORDER_STATUS.Cancelled, ORDER_STATUS.Returned];

// const PAYMENT_STATUS = {
//   Pending: 'Pending', // waiting for customer to complete checkout, probably needs 3DS verification
//   Authorised: 'Authorised', // payment has been authorised successfully for 7 days
//   Captured: 'Captured', // we have captured the authorisation
//   Refunded: 'Refunded', // payment has been refunded, may not be the whole payment
// };

const PAYMENT_PROVIDERS = {
  Stripe: 'stripe',
};

const SHIPPING_TYPE = {
  Collection: 'collection',
  Delivery: 'delivery',
};

const REFUND_STATUS = {
  Pending: 'Pending',
  PartiallyPaid: 'PartiallyPaid',
  Paid: 'Paid',
};

const SINGLETONS = {
  Countries: 'Countries',
  Currencies: 'Currencies',
  Languages: 'Languages',
  Categories: 'Categories',
  Shipping: 'Shipping',
  Roles: 'Roles',
  Configuration: 'Configuration',
};

const IMAGE_TYPES = {
  Product: 'product',
  Category: 'category',
};

const NOTIFICATIONS = {
  ForgotPassword: 'ForgotPassword',
  PasswordReset: 'PasswordReset',
  Welcome: 'Welcome',
  OrderRefunded: 'OrderRefunded',
  OrderDelivered: 'OrderDelivered',
  OrderReceived: 'OrderReceived',
  OrderShipped: 'OrderShipped',
  CashPaymentMethods: 'CashPaymentMethods',
  CartAbandonment: 'CartAbandonment',
};

const USER_STATUS = {
  PendingPhone: 'PendingPhone',
  PendingVerification: 'PendingVerification',
  Verified: 'Verified',
  Disabled: 'Disabled',
  Deleted: 'Deleted',
};

const ROLES = {
  User: 'user',
  Seller: 'seller',
  Merchant: 'merchant',
  Administrator: 'administrator',
  Impersonate: 'impersonate',
};

const ALERT_STATUS = {
  Active: 'Active',
  Dismissed: 'Dismissed',
};

const ALERT_TYPES = {
  OutOfStock: 'OutOfStock',
  SubscriptionPaymentFailed: 'SubscriptionPaymentFailed',
};

const SHIPMENT_STATUS = {
  Pending: 'Pending',
  Delivered: 'Delivered',
};

const EMAIL_VERIFICATION_STATUS = {
  Verified: 'Verified',
  Disposible: 'ACCOUNT_DISPOSIBLE_EMAIL', // error code
  Undeliverable: 'ACCOUNT_UNDELIVERABLE_EMAIL', // error code
};

const PRODUCT_TYPES = {
  Bundle: 'bundle',
  Product: 'product',
};

const DISCOUNT_TYPES = {
  Subscription: 'subscription',
  Percentage: 'percentage',
  FixedCartAmount: 'fixedCartAmount',
  FixedCartCredits: 'fixedCartCredits',
};

const DISCOUNT_STATUS = {
  Pending: 'Pending',
  Approved: 'Approved',
};

// see https://stripe.com/docs/payments/intents#intent-statuses
const STRIPE_PAYMENT_STATUS = {
  RequiresConfirmation: 'requires_confirmation',
  RequiresPaymentMethod: 'requires_payment_method',
  RequiresAction: 'requires_action',
  RequiresCapture: 'requires_capture',
  Processing: 'processing',
  Succeeded: 'succeeded',
  Cancelled: 'canceled',
};

const STRIPE_EVENTS = {
  AmountCapturableUpdated: 'payment_intent.amount_capturable_updated',
  Cancelled: 'payment_intent.canceled',
  Failed: 'payment_intent.payment_failed',
  Succeeded: 'payment_intent.succeeded',
};

// PREFIX EVENT CODE WITH SYSTEM AREA i.e Order_PaymentTaken
const AUDIT_EVENTS = {
  Stripe_Event: 'Stripe_Event',
  Order_PaymentCaptured: 'Order_PaymentCaptured',
  Order_PaymentFailed: 'Order_PaymentFailed',
  Order_StateChange: 'Order_StateChange',
  Order_Refunded: 'Order_Refunded',
  Checkout_Completed: 'Checkout_Completed',
  Email_Sent: 'Email_Sent',
  Email_Failed: 'Email_Failed',
  Sms_Sent: 'Sms_Sent',
};

const CACHE_KEYS = {
  Categories: 'categories',
  ActiveDiscounts: 'discounts:active',
  AddressBook: 'addressbook:{0}',
};

module.exports = {
  DISCOUNT_TYPES,
  DISCOUNT_STATUS,
  ORDER_STATUS,
  FAILURE_ORDER_STATUS,
  SUCCESS_ORDER_STATUS,
  AUDIT_EVENTS,
  PRODUCT_TYPES,
  ALERT_STATUS,
  ALERT_TYPES,
  USER_STATUS,
  ROLES,
  NOTIFICATIONS,
  STRIPE_PAYMENT_STATUS,
  STRIPE_EVENTS,
  SHIPMENT_STATUS,
  SHIPPING_TYPE,
  CACHE_KEYS,
  IMAGE_TYPES,
  SINGLETONS,
  REFUND_STATUS,
  TEST_INFO,
  FILE_EXTENSIONS,
  EMAIL_VERIFICATION_STATUS,
  PAYMENT_PROVIDERS,
};
