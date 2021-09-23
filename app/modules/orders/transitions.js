const actions = require('./actions');
const systemEvents = require('../../systemEvents');
const { ORDER_STATUS, NOTIFICATIONS, PAYMENT_PROVIDERS } = require('../../constants');

module.exports = {
  Pending: {
    name: ORDER_STATUS.Pending,
    transitions: [ORDER_STATUS.PaymentTaken, ORDER_STATUS.PaymentFailed],
    notification: null,
    status: 'pending',
    actions: [actions.storeOrder, actions.createPayment, actions.cashPaymentNotification],
    events: [systemEvents.EVENTS.StockReserved],
    order: true,
    allItems: true,
    fields: [],
    autoTransitionTo: (context) => {
      if (context.order.orderTotal === 0) return ORDER_STATUS.PaymentTaken;
      return null;
    },
  },
  PaymentFailed: {
    name: ORDER_STATUS.PaymentFailed,
    transitions: [],
    notification: null,
    status: 'failed',
    actions: [actions.cancelPayment, actions.releaseStock],
    events: [systemEvents.EVENTS.StateChanged],
    order: true,
    allItems: true,
    fields: [],
    canTransitionTo: (order) =>
      (order.status === ORDER_STATUS.Pending && !order.payments.some((p) => p.provider === PAYMENT_PROVIDERS.Stripe)) ||
      order.status !== ORDER_STATUS.Pending,
  },
  PaymentTaken: {
    name: ORDER_STATUS.PaymentTaken,
    transitions: [ORDER_STATUS.Cancelled, ORDER_STATUS.PaymentCaptured, ORDER_STATUS.Shipped],
    notification: NOTIFICATIONS.OrderReceived,
    status: 'paid',
    actions: [actions.validatePaymentProvider, actions.setPaymentTransactionId, actions.deleteCart],
    events: [systemEvents.EVENTS.StateChanged],
    order: true,
    allItems: true,
    fields: [
      {
        name: 'transactionId',
        required: false,
      },
    ],
    autoTransitionTo: (context) => {
      if (context.order.payments.some((p) => p.provider === PAYMENT_PROVIDERS.Cash) || context.order.orderTotal === 0)
        return ORDER_STATUS.PaymentCaptured;
      return null;
    },
    canTransitionTo: (order) =>
      (order.status === ORDER_STATUS.Pending && !order.payments.some((p) => p.provider === PAYMENT_PROVIDERS.Stripe)) ||
      order.status !== ORDER_STATUS.Pending,
  },
  Cancelled: {
    name: ORDER_STATUS.Cancelled,
    transitions: [],
    notification: null,
    status: 'failed',
    actions: [actions.releaseStock, actions.addItemsToRefund, actions.conditionalCancelPayment],
    events: [systemEvents.EVENTS.StateChanged, systemEvents.EVENTS.StockReleased],
    order: false,
    allItems: false,
    fields: [],
    canTransitionTo: (order) =>
      (order.status === ORDER_STATUS.Pending && !order.payments.some((p) => p.provider === PAYMENT_PROVIDERS.Stripe)) ||
      order.status !== ORDER_STATUS.Pending,
  },
  PaymentCaptured: {
    name: ORDER_STATUS.PaymentCaptured,
    transitions: [ORDER_STATUS.Shipped, ORDER_STATUS.Cancelled],
    notification: null,
    status: 'paid',
    actions: [actions.capturePayment],
    events: [systemEvents.EVENTS.StateChanged],
    order: true,
    allItems: true,
    canTransitionTo: (order) => order.payments.every((p) => !p.capturedAt),
    itemFilter: (context) => context.items.filter((i) => i.status !== ORDER_STATUS.Cancelled),
    fields: [],
  },
  Shipped: {
    name: ORDER_STATUS.Shipped,
    transitions: [ORDER_STATUS.Delivered],
    notification: NOTIFICATIONS.OrderShipped,
    status: 'paid',
    actions: [actions.capturePayment, actions.createShipment],
    events: [systemEvents.EVENTS.StateChanged],
    order: false,
    allItems: false,
    fields: [
      {
        name: 'courier',
        required: false,
      },
      {
        name: 'tracking',
        required: false,
      },
      {
        name: 'notes',
        required: false,
      },
    ],
  },
  Delivered: {
    name: ORDER_STATUS.Delivered,
    transitions: [ORDER_STATUS.ReturnPending],
    notification: NOTIFICATIONS.OrderDelivered,
    status: 'paid',
    actions: [],
    events: [systemEvents.EVENTS.StateChanged],
    order: false,
    allItems: false,
    fields: [],
  },
  ReturnPending: {
    name: ORDER_STATUS.ReturnPending,
    transitions: [ORDER_STATUS.Returned, ORDER_STATUS.Delivered],
    notification: null,
    status: 'paid',
    actions: [],
    events: [systemEvents.EVENTS.StateChanged],
    order: false,
    allItems: false,
    fields: [],
  },
  Returned: {
    name: ORDER_STATUS.Returned,
    transitions: [],
    notification: NOTIFICATIONS.OrderRefunded,
    status: 'paid',
    actions: [actions.releaseStock, actions.addItemsToRefund],
    events: [systemEvents.EVENTS.StateChanged, systemEvents.EVENTS.StockReleased],
    order: false,
    allItems: false,
    fields: [],
  },
};
