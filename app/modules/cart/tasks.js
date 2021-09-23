const moment = require('moment');
const raven = require('../ravendb');
const notifications = require('../notifications');
const { tryExecuteAsync } = require('../../utils/common');
const { NOTIFICATIONS } = require('../../constants');

const send = async (session, user, cart) => {
  cart.sendCount += 1;
  cart.sentReminderAt = moment.utc().toISOString();

  await notifications.send(user, NOTIFICATIONS.CartAbandonment, {
    session,
    cart,
    subject: cart.sendCount === 1 ? 'Did you forget something?' : 'Your cart is about to expire',
  });
};

const sendReminders = async (applyQuery, job) => {
  await tryExecuteAsync(
    async () => {
      const session = new raven.Session();
      const carts = await applyQuery(session);

      if (carts && carts.length > 0) {
        const users = await Promise.all(
          carts.map((s) => {
            return session.get(s.userId);
          }),
        );

        const promises = carts
          .filter((c) => users.find((u) => u && u.id === c.userId))
          .map((cart) => {
            return send(
              session,
              users.find((u) => u && u.id === cart.userId),
              cart,
            );
          });

        await Promise.all(promises);
        await session.commit();
      }
    },
    true,
    false,
    { name: `JOB:${job}` },
  );
};

const sendCartReminders = async () => {
  await sendReminders((session) => {
    return session
      .carts()
      .include('userId')
      .whereEquals('sendCount', 0)
      .whereNotEquals('userId', null)
      .whereLessThan('updatedAt', moment.utc().add(-60, 'minutes').toDate())
      .all();
  }, 'sendFirstCartReminders');

  await sendReminders((session) => {
    return session
      .carts()
      .include('userId')
      .whereEquals('sendCount', 1)
      .whereNotEquals('userId', null)
      .whereLessThan('sentReminderAt', moment.utc().add(-2, 'days').toDate())
      .all();
  }, 'sendSecondCartReminders');
};

module.exports = {
  sendCartReminders,
};
