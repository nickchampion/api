const Boom = require('@hapi/boom');
const _ = require('lodash');
const transitions = require('./transitions');
const events = require('../events');
const AuditLog = require('../audit');
const math = require('../../utils/math');
const { AUDIT_EVENTS, PRODUCT_TYPES, ORDER_STATUS, REFUND_STATUS } = require('../../constants');

class OrderStateMachine {
  /*
  Transition order or order items to the specified status, context is defined as
  {
    order > the order in question, status will already be the new status we've transitioned to
    items > items affected by the change, may have 2 shipments on an order, one item gets cancelled, this is to handle fulfilment on a per item basis
    payment > current payment intent from Stripe
    subscription > only if we're creating a subscription order
    user > current user
    session > current raven session
  }
  */
  async transition(context) {
    // init context by loading the transition we're transitioning to and setting up other fields / methods for the pipeline
    this.initialise(context);

    // make sure the transition is valid, this will throw an error if not
    this.validate(context);

    // execute transition actions
    await this.execute(context);

    // update relevant entities in DB, order, subscription etc, audit the result and we're done
    await this.complete(context);

    // autoTransition runs some logic checks to see if we should automatically move the order to another state
    // it recurively calls transition until we're done
    return this.autoTransition(context);
  }

  autoTransition(context) {
    const transition = this.getTransition(context.status);

    if (transition.autoTransitionTo) {
      const nextStatus = transition.autoTransitionTo(context);

      if (nextStatus) {
        context.status = nextStatus;
        return this.transition(context);
      }
    }

    // if we get here we're done no more transitions so add the events commit action
    context.session.addCommitAction(() => {
      context.transitions.forEach((t) => {
        const ctx = {
          ...context,
          transition: t,
        };

        t.events.forEach((e) => {
          events.raise(e, ctx);
        });
      });
    });

    return context;
  }

  initialise(context) {
    // get the transition we're moving to
    context.transition = this.getTransition(context.status);

    // some transitions need to allow mixed status, for example PaymentCaptured operates on all
    // items but if an item has already been cancelled we should ignore it
    if (context.transition.itemFilter) context.items = context.transition.itemFilter(context);

    // we'll store each transition on the context so after commiting session we can execute the transition specific events
    if (!context.transitions) context.transitions = [context.transition];
    else context.transitions.push(context.transition);
  }

  async complete(context) {
    // update order item status
    context.items.forEach((item) => {
      item.status = context.status;
    });

    // update order status if its an order level transition or all the items are in the same status
    if (context.transition.order || _.every(context.order.items, ['status', context.status])) context.order.status = context.status;

    // audit
    await new AuditLog(AUDIT_EVENTS.Order_StateChange)
      .withMessage(`StateMachine transition to ${context.status} for items ${context.items.map((i) => i.id).join(',')}`)
      .withOrder(context.order.id)
      .withOrderCode(context.order.code)
      .withUser(context.order.userId)
      .withData({
        itemIds: context.items.map((i) => i.id),
        payment: context.payment || {},
      })
      .withSubscription(context.subscription ? context.subscription.id : null)
      .store(context.session);
  }

  hasPaymentBeenTaken(status) {
    return this.getTransition(status).status === 'paid';
  }

  hasPaymentFailed(status) {
    return this.getTransition(status).status === 'failed';
  }

  isPaymentPending(status) {
    return this.getTransition(status).status === 'pending';
  }

  getTransition(state) {
    return transitions[state];
  }

  getItemTransitions() {
    return transitions.filter((t) => !t.order);
  }

  async setOrderTransitions(context, order) {
    order.transitions = [];

    // work out which transitions we have available based on item status
    order.items.forEach((item) => {
      item.currency = order.currency;

      const transition = this.getTransition(item.status);

      transition.transitions.forEach((t) => {
        const next = order.transitions.find((tr) => tr.status === t);

        if (next) {
          next.items.push(item.id);
        } else {
          const nextTransition = this.getTransition(t);

          if (!nextTransition.canTransitionTo || nextTransition.canTransitionTo(order)) {
            order.transitions.push({
              status: nextTransition.name,
              items: [item.id],
              fields: nextTransition.fields,
              allItems: nextTransition.allItems,
              entity: 'order',
              prefix: 'Change Status To ',
            });
          }
        }
      });
    });

    // add any additional order actions
    if (order.refund && order.refund.status !== REFUND_STATUS.Paid) {
      const items = order.items.filter((i) => i.refund && i.refund.status !== REFUND_STATUS.Paid);

      order.transitions.push({
        status: 'Refund Customer',
        // eslint-disable-next-line max-len
        message: `If its a cash refund please ensure you have already deposited the refund in customers account. For Credits or Stripe we will trigger the refund when you click the submit button below. Outstanding balance: ${
          order.currency
        } $${math.round(_.sum(items.map((i) => i.refund.amount)))}`,
        items: items.map((i) => i.id),
        fields: [
          {
            name: 'transactionId',
            required: false,
            message: 'Transaction ID for cash refund only',
          },
          {
            name: 'credits',
            required: false,
            message: 'Please enter "true" if you want to refund via credits',
          },
        ],
        allItems: true,
        entity: 'refund',
        prefix: '',
      });
    }

    return order;
  }

  validate(context) {
    // this is handling possible duplicate event notifications from Stripe
    if (context.status !== ORDER_STATUS.Pending && context.items.every((i) => i.status === context.status)) throw new Error('DUPLICATE');

    // dont validate if we're in Pending state as this is order being created
    if (context.status === ORDER_STATUS.Pending && context.items.every((i) => i.status === context.status)) return;

    context.items.forEach((item) => {
      if (!this.getTransition(item.status).transitions.includes(context.status))
        throw Boom.badImplementation('ORDERS_INVALID_TRANSITION', [item.status, context.status, item.id]);
    });
  }

  async execute(context) {
    // eslint-disable-next-line no-restricted-syntax
    for (const action of context.transition.actions) {
      // eslint-disable-next-line no-await-in-loop
      await action(context);
    }
  }
}

module.exports = new OrderStateMachine();
