const Boom = require('@hapi/boom');
const config = require('../../modules/configuration').config();
const stripe = require('../../modules/payments/stripe');
const security = require('../../utils/security');
const orders = require('../../modules/orders');
const AuditLog = require('../../modules/audit');
const { tryExecute } = require('../../utils/common');
const { AUDIT_EVENTS, STRIPE_EVENTS, PAYMENT_PROVIDERS } = require('../../constants');

class StripeController {
  async events(request) {
    let evt;

    if (config.dev) {
      evt = JSON.parse(request.payload.toString('utf8'));
    } else {
      const signature = request.headers['stripe-signature'];
      evt = tryExecute(() => stripe.constructEvent(request.payload.toString('utf8'), signature), true, false, {
        payload: request.payload.toString('utf8'),
        name: 'StripeEventValidationFailed',
      });

      // if signature validation fails return success, but dont do anything
      if (evt.failed) {
        return {
          received: true,
        };
      }
    }

    switch (evt.type) {
      case STRIPE_EVENTS.AmountCapturableUpdated: // Should get this when checkout is complete and we've sucessfully created the payment
        await this.handler(evt, request, orders.completeOrder);
        break;
      case STRIPE_EVENTS.Succeeded: // Should get this when we capture a payment when items are shipped
        await this.handler(evt, request, orders.completeOrder);
        break;
      case STRIPE_EVENTS.Cancelled:
        await this.handler(evt, request, orders.statusUpdate);
        break;
      case STRIPE_EVENTS.Failed:
        await this.handler(evt, request, orders.failOrder);
        break;
      default:
        await new AuditLog(AUDIT_EVENTS.Stripe_Event)
          .withMessage(`Event ${evt.type} recieved, not handled.`)
          .withData({
            event: evt,
          })
          .store(request.context.session);
        break;
    }

    return {
      received: true,
    };
  }

  async handler(evt, request, action) {
    // only process events in the correct environment with a valid orderId
    if (evt.data.object.metadata.tag !== config.tag) return;
    if (!evt.data.object.metadata.orderId) return;

    const pm = await stripe.determineTransition(evt.data.object);
    const args = {
      context: request.context,
      payment: pm,
      orderId: security.decodeOrderId(evt.data.object.metadata.orderId),
      id: security.decodeOrderId(evt.data.object.metadata.orderId),
      status: pm.transitionTo,
      provider: PAYMENT_PROVIDERS.Stripe,
    };

    try {
      const result = await action(args);
      if (result.status === 'error') throw Boom.badRequest('COMMON_ERROR', [result.message]);
    } catch (e) {
      e.name = 'StripeUnhandledError';
      e.context = {
        orderId: evt.data.object.metadata.orderId,
      };
      if (e.message !== 'DUPLICATE') throw e;
    }
  }
}

module.exports = StripeController;
