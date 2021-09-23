const Boom = require('@hapi/boom');
const _ = require('lodash');
const raven = require('../ravendb');
const events = require('../events');
const { ALERT_TYPES, ALERT_STATUS } = require('../../constants');

const alertTypes = _.map(ALERT_TYPES, (e) => e);

class Alert {
  constructor(type) {
    // make sure its a valid event type
    if (!alertTypes.includes(type)) throw Boom.badRequest('ALERT_INVALID_TYPE', [alertTypes.join(', ')]);

    this.alert = new raven.Models.Alert({
      type,
      status: ALERT_STATUS.Active,
    });
  }

  withDescription(description) {
    this.alert.description = description;
    return this;
  }

  withData(data) {
    this.alert.data = data;
    return this;
  }

  async store(session) {
    await session.store(this.alert);
    events.raise(events.EVENTS.AlertRaised, this.alert);
  }
}

module.exports = Alert;
