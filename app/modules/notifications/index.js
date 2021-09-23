const sgMail = require('@sendgrid/mail');
const slug = require('slug');
const _ = require('lodash');
const errordite = require('../errordite');
const systemEvents = require('../../systemEvents');
const twilio = require('../../services/twilio');
const config = require('../configuration').config();
const templates = require('./templates');
const { AUDIT_EVENTS, USER_STATUS } = require('../../constants');
const AuditLog = require('../audit');

sgMail.setApiKey(config.sendGrid.apiKey);

const sendEmail = async (user, options, data, session) => {
  try {
    await sgMail.send(options.template);

    await new AuditLog(AUDIT_EVENTS.Email_Sent)
      .withMessage(`Email ${options.template.subject} sent to ${options.template.to}`)
      .withOrder(data.orderId || null)
      .withUser(user.id)
      .withHtml(options.template.html)
      .withEmail(options.template.to)
      .withReferenceId(options.name || slug(options.template.subject).toLowerCase())
      .store(session);
  } catch (err) {
    err.name = 'SendEmail';
    err.context = {
      html: options && options.template ? options.template.html : '',
      to: user.email,
      data: JSON.stringify(data),
    };
    errordite.log(err);
  }
};

const sendSms = async (user, options, data, session) => {
  try {
    // if we're sending an SMS and we have a zurl token we need to create a short url
    if (options.template.zurl && options.template.sms.indexOf('{zurl}') > -1) {
      options.template.sms = options.template.sms.replace('{zurl}', options.template.zurl);
    }

    await twilio.send(user.phone, options.template.sms);
    await new AuditLog(AUDIT_EVENTS.Sms_Sent)
      .withMessage(`SMS ${options.template.subject} sent to ${user.phone}`)
      .withOrder(data.orderId || null)
      .withUser(user.id)
      .withHtml(options.template.sms)
      .withEmail(options.template.to)
      .withReferenceId(options.name || slug(options.template.subject).toLowerCase())
      .store(session);
  } catch (err) {
    err.name = 'SendSMS';
    err.context = {
      sms: options && options.template ? options.template.sms : '',
      to: user.phone,
      data: JSON.stringify(data),
    };
    errordite.log(err);
  }
};

const send = async (user, template, args) => {
  const { session } = args;
  delete args.session;

  const options = await templates[`get${template}Template`](user, args);

  if (!options) return;

  const data = options.data || {};

  options.name = template;

  if (!user.notifications || user.notifications.includes('email') || args.force) {
    await sendEmail(user, options, data, session);
  }

  if (args.skipSms && args.skipSms === true) return;

  if (
    (user.notifications && (user.notifications.includes('sms') || template === 'Welcome') && user.status !== USER_STATUS.PendingPhone) ||
    args.forceSms
  ) {
    await sendSms(user, options, data, session);
  }
};

const queue = (user, template, args) => {
  args.session.addCommitAction(async () => {
    await send(_.cloneDeep(user), template, {
      ...args,
      session: null,
    });
  });
};

const stateChanged = (state) => {
  if (state && state.transition && state.transition.notification) {
    send(state.user, state.transition.notification, { ...state, session: null })
      .then(() => {})
      .catch((err) => {
        errordite.log(err);
      });
  }
};

// listen for the StateChanged event
systemEvents.listen(systemEvents.EVENTS.StateChanged, stateChanged);

module.exports = {
  send,
  queue,
};
