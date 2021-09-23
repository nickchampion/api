// const rp = require('request-promise-native');
const { ORDER_STATUS } = require('../../constants');
const systemEvents = require('../../systemEvents');
const raven = require('../ravendb');
const config = require('../configuration').config();

const post = async () => {
  // const options = {
  //   method: 'POST',
  //   uri: config.slack.webHook,
  //   json: true,
  //   body: {
  //     username: 'Zesttee Bot',
  //     text: message,
  //     icon_emoji: emoji || ':male-doctor:',
  //   },
  // };
  // await rp(options);
};

const stateChanged = async (state) => {
  if (state && state.transition) {
    if (state.transition.name === ORDER_STATUS.PaymentTaken) {
      await post(
        `Order received; amount: ${state.order.orderTotal} user: ${state.user.firstName} ${state.user.lastName}; url: <${
          config.zesttee.adminUrl
        }orders/${raven.utils.friendlyId(state.order.id)}/edit|Click here for details!>`,
      );
    }
    if (state.transition.name === ORDER_STATUS.Cancelled) {
      await post(
        `Order Cancelled; user: ${state.user.firstName} ${state.user.lastName}; url: <${config.zesttee.adminUrl}orders/${raven.utils.friendlyId(
          state.order.id,
        )}/edit|Click here for details!>`,
      );
    }
  }
};

const alertRaised = async (alert) => {
  await post(`New Alert; ${alert.type}; ${alert.description};`);
};

systemEvents.listen(systemEvents.EVENTS.StateChanged, stateChanged);
systemEvents.listen(systemEvents.EVENTS.AlertRaised, alertRaised);

module.exports.post = post;
