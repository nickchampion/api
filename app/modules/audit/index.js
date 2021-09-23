const _ = require('lodash');
const Boom = require('@hapi/boom');
const raven = require('../ravendb');
const { AUDIT_EVENTS } = require('../../constants');

const events = _.map(AUDIT_EVENTS, (e) => e);

class AuditLog {
  constructor(event) {
    // make sure its a valid event type
    if (!events.includes(event)) throw Boom.badRequest('AUDIT_INVALID_EVENT_TYPE', [events.join(', ')]);

    this.auditEvent = new raven.Models.Audit({
      createdAt: new Date().toISOString(),
      eventCode: event,
      referenceIds: [],
      success: true, // default to true, use failed() if not successful operation
    });
  }

  withMessage(message) {
    this.auditEvent.message = message;
    return this;
  }

  withUser(id) {
    this.auditEvent.userId = id;
    return this;
  }

  withSubscription(id) {
    this.auditEvent.subscriptionId = id;
    return this;
  }

  withOrder(id) {
    this.auditEvent.orderId = id;
    return this;
  }

  withOrderCode(code) {
    this.auditEvent.orderCode = code;
    return this;
  }

  withData(data) {
    this.auditEvent.data = data;
    return this;
  }

  withError(error) {
    this.auditEvent.error = error;
    return this;
  }

  withHtml(html) {
    this.auditEvent.html = html;
    return this;
  }

  withEmail(email) {
    this.auditEvent.email = email;
    return this;
  }

  withReferenceId(id) {
    if (id) this.auditEvent.referenceIds.push(id);
    return this;
  }

  // call this method if the audit event failed
  failed() {
    this.auditEvent.success = false;
    return this;
  }

  async store(session) {
    if (!session) {
      await raven.execute(async (s) => {
        await s.store(this.auditEvent);
      });
    } else {
      await session.store(this.auditEvent);
    }
  }
}

module.exports = AuditLog;
