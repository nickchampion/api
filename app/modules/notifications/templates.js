const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const Email = require('email-templates');
const config = require('../configuration').config();
const { PRODUCT_TYPES, VERTICALS } = require('../../constants');
const common = require('../../utils/common');
const zesttee = require('../../utils/zesttee');
const raven = require('../ravendb');
const shipping = require('../shipping');

const infoEmail = config.sendGrid.defaultEmail;
const mainWebUrl = config.zesttee.webUrl;
const environmentTag = config.production ? 'Zesttee' : `Zesttee (${config.tag})`;
const from = `${environmentTag} <${config.sendGrid.replyEmail}>`;

// EMAILS
const cartAbandonment = path.join(__dirname, 'templates', 'cartAbandonment.ejs');
const confirmOrder = path.join(__dirname, 'templates', 'confirmOrder.ejs');
const passwordUpdated = path.join(__dirname, 'templates', 'passwordUpdated.ejs');
const passwordReset = path.join(__dirname, 'templates', 'passwordReset.ejs');
const welcomeMember = path.join(__dirname, 'templates', 'welcomeMember.ejs');
const insideMyPack = path.join(__dirname, 'templates', 'insideMyPack.ejs');
const insideMyPackMSH = path.join(__dirname, 'templates', 'MSHinsideMyPack.ejs');
const subscriptionEmail = path.join(__dirname, 'templates', 'subscriptionEmail.ejs');
const shippedEmail = path.join(__dirname, 'templates', 'shippedEmail.ejs');
const feedbackEmail = path.join(__dirname, 'templates', 'feedbackEmail.ejs');
const refundEmail = path.join(__dirname, 'templates', 'refundEmail.ejs');
const completeSurveyReminder = path.join(__dirname, 'templates', 'completeSurveyReminder.ejs');
const completeSurveyReminderMSH = path.join(__dirname, 'templates', 'MSHcompleteSurveyReminder.ejs');
const completeSurveyReminderMSH2 = path.join(__dirname, 'templates', 'MSHcompleteSurveyReminder2.ejs');
const deliveredEmail = path.join(__dirname, 'templates', 'deliveredEmail.ejs');
const sendDailyHealthSampleReportUpload = path.join(__dirname, 'templates', 'sendDailyHealthSampleReportUpload.ejs');
const sendDailyHealthSampleReportTest = path.join(__dirname, 'templates', 'sendDailyHealthSampleReportTest.ejs');
const sendSexualHealthSampleReportUpload = path.join(__dirname, 'templates', 'sendSexualHealthSampleReportUpload.ejs');
const sendSexualHealthSampleReportTest = path.join(__dirname, 'templates', 'sendSexualHealthSampleReportTest.ejs');
const testResultsReady = path.join(__dirname, 'templates', 'testResultsReady.ejs');
const uploadLabResult = path.join(__dirname, 'templates', 'uploadLabResult.ejs');
const telehealthAppointment = path.join(__dirname, 'templates', 'telehealthAppointment.ejs');
const telehealthReminder = path.join(__dirname, 'templates', 'telehealthReminder.ejs');
const cashPaymentMethods = path.join(__dirname, 'templates', 'cashPaymentMethods.ejs');
const creditsExpiring = path.join(__dirname, 'templates', 'creditsExpiring.ejs');
const zestteeTemplate = path.join(__dirname, 'templates', 'zesttee.ejs');

const email = new Email({
  message: {
    from,
  },
  transport: {
    jsonTransport: true,
  },
  views: {
    options: {
      extension: 'ejs',
    },
  },
});

const getDefaultImage = (id, productType) => {
  const type = id.split('/')[0];

  switch (type) {
    case 'products': {
      switch (productType) {
        case 'testkit':
          return 'https://www.zesttee.com/static/images/testkitproduct.png';
        case 'supplement':
          return 'https://ztelivemedia.blob.core.windows.net/product/ashwagandha_8cc5d39c166d_940-a.png';
        default:
          return 'https://media.zesttee.com/cms/controlpackfrontback_8453-a.png';
      }
    }
    case 'packs': {
      return 'https://www.zesttee.com/static/images/supplementPack.png';
    }
    case 'medications': {
      return 'https://www.zesttee.com/cdn-cgi/image/width=171,quality=100/https://media.zesttee.com/cms/ed-treatment-pills-xs_7048-a.jpg';
    }
    default:
      return 'https://ztelivemedia.blob.core.windows.net/product/ashwagandha_8cc5d39c166d_940-a.png';
  }
};

const getZestteeTemplate = async (user, args) => {
  const emailTemplate = await email.render(zestteeTemplate, {
    content: args.content,
  });

  return {
    template: {
      from, // sender address
      to: config.zesttee.adminEmails, // list of receivers
      subject: args.subject, // Subject line
      html: emailTemplate,
    },
  };
};

const getCartAbandonmentTemplate = async (user, args) => {
  const content = await email.render(cartAbandonment, {
    name: user.firstName || '',
    cart: args.cart,
    url: `${mainWebUrl}cart`,
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: args.subject, // Subject line
      html: content,
    },
  };
};

const getCreditsExpiringTemplate = async (user, args) => {
  const content = await email.render(creditsExpiring, {
    url: `${mainWebUrl}`,
    image:
      args.days === 7
        ? 'https://media.zesttee.com/cms/creditexpiring7daysclock_8097-b.png'
        : 'https://media.zesttee.com/cms/creditexpiring30days_8098-b.png',
    days: args.days,
    amount: args.amount,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Your Zesttee credits are expiring soon!', // Subject line
      html: content,
      sms: `Hi ${user.firstName || ''}, your ${args.amount} Zesttee credits will be expiring in ${
        args.days
      } days. Visit ${mainWebUrl} to use them on your next purchase.`,
    },
  };
};

const getCashPaymentMethodsTemplate = async (user, args) => {
  const url = `${mainWebUrl}thank-you?code=${args.code}&amount=${args.amount}`;
  const content = await email.render(cashPaymentMethods, { url, code: args.code, amount: args.amount });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Cash Payment Options', // Subject line
      html: content,
      // eslint-disable-next-line max-len
      sms: `Please make cash payment of $${args.amount} within 2 hours for your order ${args.code}. ${url}`,
    },
  };
};

const getForgotPasswordTemplate = async (user, args) => {
  const content = await email.render(passwordReset, {
    name: user.firstName || '',
    token: args.url,
    timeToken: config.security.emailVerificationTokenExpiryDisplay,
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Reset password Request', // Subject line
      html: content,
      sms: `${user.firstName || ''}, click here to reset your password. {zurl}`,
      zurl: args.url,
    },
  };
};

const getTelehealthAppointmentTemplate = async (user, args) => {
  const content = await email.render(telehealthAppointment, {
    name: `${user.firstName} ${user.lastName}`,
    url: args.url,
    time: args.time,
  });

  return {
    template: {
      from,
      to: user.email,
      subject: 'Telehealth Appointment Link and Reminder',
      html: content,
      sms: `Your Zesttee tele-health is confirmed for ${args.time}. Please visit {zurl} to start video call with doctor.`,
      zurl: args.url,
    },
  };
};

const getTelehealthReminderTemplate = async (user, args) => {
  const content = await email.render(telehealthReminder, {
    name: `${user.firstName}`,
    url: args.url,
  });

  return {
    template: {
      from,
      to: user.email,
      subject: 'Complete your telehealth appointment',
      html: content,
      sms: `You're nearly there! Click here setup your telehealth appointment {zurl}`,
      zurl: args.url,
    },
  };
};

const getPasswordResetTemplate = async (user) => {
  const content = await email.render(passwordUpdated, {
    infoEmail,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Password has been updated', // Subject line
      html: content, // html body
      sms: `Zesttee, your password has been reset successfully`,
    },
  };
};

const getWelcomeTemplate = async (user) => {
  const name = user.firstName || '';
  const content = await email.render(welcomeMember, {
    infoEmail,
    name,
    dailyHealthLink: `${mainWebUrl}daily-health`,
    homeLabTestsLink: `${mainWebUrl}home-lab-tests`,
    mensSexualHealthLink: `${mainWebUrl}sexual-health`,
    mensHairLossLink: `${mainWebUrl}hair-loss`,
    sleepStressLink: `${mainWebUrl}sleep`,
    womensSexualHealthLink: `${mainWebUrl}women-sexual-health`,
    fertilityLink: `${mainWebUrl}fertility`,
  });
  const telegram = user.gender && user.gender === 'Male' ? 'https://t.me/mrzesttee' : 'https://t.me/zesttee';

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Welcome to Zesttee!', // Subject line
      html: content, // html body
      // eslint-disable-next-line max-len
      sms: `Hi ${name}, welcome to Zesttee. Join our Telegram ${telegram} to stay up-to-date with the latest health tips! Get free guidance and support today.`,
    },
  };
};

const getOrderShippedTemplate = async (user, args) => {
  // only send if its a shipped order not collection
  if ((await shipping.getFromOrder(args.order)).collection) return null;

  const dataProduct = [];
  const productIds = args.order.items.filter((i) => i.productId !== null).map((i) => i.productId);
  const products = productIds.length > 0 ? await raven.execute((session) => session.products().whereIn('id', productIds).all()) : [];

  args.order.items.forEach((e) => {
    const data = {
      name: e.name,
    };

    if (e.productId) {
      const product = products.find((p) => p.id === e.productId);

      if (product) {
        if (product.bullets) data.bullets = product.bullets;
        data.image = product.image || (product.images ? product.images.primary : null) || getDefaultImage(product.id, product.productType);
      }
    } else {
      data.image = e.image || getDefaultImage(zesttee.extractItemId(e));
    }

    dataProduct.push(data);
  });

  const content = await email.render(shippedEmail, {
    results: args.order,
    code: args.order.code,
    notes: args.order.shipments[args.order.shipments.length - 1].notes,
    dataProduct,
    name: user.firstName || '',
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Your order has shipped', // Subject line
      html: content, // html body
      sms: `Hi ${user.firstName || ''}, your order '${args.order.code}' has shipped. ${mainWebUrl}profile/orders`,
    },
    data: {
      orderId: args.order.id,
      userId: args.order.userId,
    },
  };
};

const getOrderDeliveredTemplate = async (user, args) => {
  const content = await email.render(deliveredEmail, {
    code: args.order.code,
    infoEmail,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Delivered order', // Subject line
      html: content, // html body
      sms: `Hi ${user.firstName || ''}, your order '${args.order.code}' has been delivered. ${mainWebUrl}profile/orders`,
    },
    data: {
      orderId: args.order.id,
      userId: args.order.userId,
    },
  };
};

// confirm order
const getOrderReceivedTemplate = async (user, args) => {
  const formatDay = moment(args.order.createdAt).format('DD/MM/YYYY H:mm a');
  const testKitsIds = args.order.items.filter((i) => i.type === PRODUCT_TYPES.TestKit).map((t) => t.productId);
  const kits = testKitsIds && testKitsIds.length > 0 ? await raven.execute((session) => session.database.load(testKitsIds)) : {};
  const filteredKits = Object.values(kits).filter((k) => k.metadata.collection);

  const m = args.order.items.map((i) => {
    return {
      ...i,
      pills: i.type === PRODUCT_TYPES.Medication ? ` (${i.size} pills)` : '',
    };
  });

  const items = _.groupBy(m, common.getItemId);

  const order = {
    ...args.order,
    items: Object.keys(items).map((i) => {
      return {
        ...items[i][0],
        qty: items[i].length,
      };
    }),
  };

  const content = await email.render(confirmOrder, {
    name: user.firstName || '',
    order,
    date: formatDay,
    code: args.order.code,
    kits: filteredKits,
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email,
      subject: 'Your order is confirmed', // Subject line
      html: content,
      sms: `Hi ${user.firstName || ''}, We have received your order '${args.order.code}'. Thank you. ${mainWebUrl}profile/orders`,
    },
    data: {
      orderId: args.order.id,
      userId: args.order.userId,
    },
  };
};

const getInsideMyPackTemplate = async (user, args) => {
  if (!args.products || !args.categories || args.products.length === 0 || args.categories.length === 0) return null;

  const template = args.vertical && args.vertical === VERTICALS.SexualHealth ? insideMyPackMSH : insideMyPack;

  const content = await email.render(template, {
    name: user.firstName || '',
    results: args.products,
    token: args.url,
    categories: args.categories,
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email,
      subject: 'Inside my pack', // Subject line
      html: content,
      sms: `Hi ${user.firstName || ''}, thanks for completing the survey, your results are here. {zurl}`,
      zurl: args.url,
    },
  };
};

const getSubscriptionReminderTemplate = async (user, args) => {
  const newUrl = `${mainWebUrl}profile/subscription`;
  const newDate = moment(args.subscription.nextBillingTime).format('MM-DD-YYYY');

  const content = await email.render(subscriptionEmail, {
    date: newDate,
    url: newUrl,
    infoEmail,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email,
      subject: 'Your subscription', // Subject line
      html: content,
      sms: `Hi ${user.firstName || ''}, Your subscription (and promise to feeling good) will renew automatically on ${newDate}.`,
    },
  };
};

const getFeedbackReceivedTemplate = async (user) => {
  const name = user.firstName ? `${user.firstName},` : '';
  const newUrl = `${mainWebUrl}help`;
  const content = await email.render(feedbackEmail, {
    name,
    newUrl,
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'From Zesttee', // Subject line
      html: content, // html body
      // eslint-disable-next-line max-len
      sms: `Hi ${name}, thanks for sharing your feedback with us, our team reviews all feedback so we can better deliver our promise of making you feel your best every day`,
    },
    data: {
      userId: user.id,
    },
  };
};

const getOrderRefundedTemplate = async (user, args) => {
  const content = await email.render(refundEmail, {
    order: args.order,
    code: args.order.code,
    helpUrl: `${mainWebUrl}help`,
    infoEmail,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Refund issued for order', // Subject line
      html: content, // html body
      sms: `We have successfully refunded ${args.order.orderTotal} ${args.order.currency} for the item(s) in order #${args.order.code}.`,
    },
    data: {
      orderId: args.order.id,
      userId: args.order.userId,
    },
  };
};

// receiverEmail, firstName, surveyId
const getSurveyReminderTemplate = async (user, args) => {
  const url = `${mainWebUrl}chat-bot?surveyId=${args.id}`;
  const template =
    args.vertical === VERTICALS.SexualHealth
      ? args.secondReminder === true
        ? completeSurveyReminderMSH2
        : completeSurveyReminderMSH
      : completeSurveyReminder;

  const content = await email.render(template, {
    url,
    newFirstName: args.firstName || '',
    infoEmail,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Complete survey reminder', // Subject line
      html: content, // html body
      sms: `You're almost there ${args.firstName || ''}! Complete your survey here: {zurl} `,
      zurl: url,
    },
    data: {
      surveyId: args.id,
    },
  };
};

const getSampleReportTemplate = async (user, args) => {
  const uploadLabResults = args.path.indexOf('upload-results') > -1 || args.path.indexOf('upload-lab-results') > -1;
  const sexualHealth = args.path.startsWith('/sexual-health');
  const reportName = uploadLabResults && sexualHealth ? 'sexual-health' : uploadLabResults ? 'daily-health' : 'test-kit';
  const subject =
    uploadLabResults && sexualHealth
      ? 'Your Sample Male Performance Test Report'
      : uploadLabResults
      ? 'Your Sample Test Report'
      : 'Sample Zesttee Home Lab Test Dashboard';
  const template =
    uploadLabResults && sexualHealth
      ? sendSexualHealthSampleReportUpload
      : uploadLabResults
      ? sendDailyHealthSampleReportUpload
      : sexualHealth
      ? sendSexualHealthSampleReportTest
      : sendDailyHealthSampleReportTest;

  const content = await email.render(template, {
    url: `${config.zesttee.apiUrl}api/sampleReport/${reportName}`,
    infoEmail,
    name: user.firstName || '',
    testUrl: `${config.zesttee.webUrl}${sexualHealth ? 'sexual-health' : 'home-lab-tests'}`,
    uploadUrl: `${config.zesttee.webUrl}${sexualHealth ? 'sexual-health/upload-results' : 'home-lab-tests/upload-lab-results'}`,
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject, // Subject line
      html: content, // html body
    },
  };
};

const getUploadLabResultsTemplate = async (user) => {
  const content = await email.render(uploadLabResult, {
    url: `${config.zesttee.webUrl}/sexual-health/upload-results`,
    infoEmail,
    name: user.firstName || '',
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: 'Upload Your Lab Results', // Subject line
      html: content, // html body
    },
  };
};

const getTestResultsReadyTemplate = async (user, args) => {
  const url = `${config.zesttee.webUrl}profile/dashboard/test-kit-results?code=${args.code}`;

  const content = await email.render(testResultsReady, {
    url,
    testName: args.testName,
    name: user.firstName || '',
    testDate: args.testDate,
    infoEmail,
  });

  return {
    template: {
      from, // sender address
      to: user.email, // list of receivers
      subject: `Your ${args.testName} test results are ready`,
      html: content, // html body
      sms: `Your ${args.testName} test results are ready! {zurl} `,
      zurl: url,
    },
  };
};

module.exports = {
  getForgotPasswordTemplate,
  getPasswordResetTemplate,
  getWelcomeTemplate,
  getInsideMyPackTemplate,
  getFeedbackReceivedTemplate,
  getOrderShippedTemplate,
  getOrderDeliveredTemplate,
  getOrderReceivedTemplate,
  getSubscriptionReminderTemplate,
  getOrderRefundedTemplate,
  getSurveyReminderTemplate,
  getSampleReportTemplate,
  getTestResultsReadyTemplate,
  getUploadLabResultsTemplate,
  getTelehealthAppointmentTemplate,
  getTelehealthReminderTemplate,
  getCashPaymentMethodsTemplate,
  getCartAbandonmentTemplate,
  getCreditsExpiringTemplate,
  getZestteeTemplate,
};
