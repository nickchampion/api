const Boom = require('@hapi/boom');
const moment = require('moment');
const crypto = require('crypto');
const twilio = require('../../services/twilio');
const { USER_STATUS, NOTIFICATIONS, TEST_INFO, EMAIL_VERIFICATION_STATUS, ROLES } = require('../../constants');
const jwt = require('../../utils/jwt');
const security = require('../../utils/security');
const geo = require('../geo');
const notifications = require('../notifications');
const raven = require('../ravendb');
const systemEvents = require('../../systemEvents');
const config = require('../configuration').config();
const ucrypto = require('../../utils/crypto');
const zesttee = require('../../utils/zesttee');
const emailVerification = require('../../services/emailVerification');
const slack = require('../notifications/slack');

const createTwilioAccount = async (user, throwOnError = true) => {
  if (user.connections && user.connections.twilio) return false;

  if (!user.connections) user.connections = {};

  const authyAccount = await twilio.register(user.email, user.phone);

  if (!authyAccount.success) {
    if (throwOnError) throw Boom.badRequest('ACCOUNT_INVALID_PHONE', [authyAccount.message]);

    user.phone = null;
    user.status = USER_STATUS.PendingPhone;
    delete user.connections.twilio;
    return false;
  }

  user.status = USER_STATUS.PendingVerification;

  user.connections.twilio = {
    authyId: authyAccount.user.id,
  };

  const name = user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'no name';

  // send slack notification
  await slack.post(
    `New user registered; <${config.zesttee.adminUrl}users/${raven.utils.friendlyId(user.id)}/edit|view>; ${raven.utils.friendlyId(
      user.id,
    )}; ${name}; <tel:${user.phone.replace(/ /g, '')}|${user.phone}> `,
  );

  return true;
};

const createUser = async (context, firstName, lastName, country, email, phone, password, status) => {
  const user = new raven.Models.User({
    email: email || null,
    firstName,
    lastName,
    password: password ? security.hash(password) : security.hash(crypto.randomBytes(32).toString('hex')),
    country: country.isoCode,
    roles: ['user'],
    status,
    timezone: context.timezone,
    connections: {},
    notifications: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phone,
  });

  await context.session.store(user);

  if (!email) {
    user.email = `user+${raven.utils.friendlyId(user.id)}@livecommerce.com`;
  }

  // raise new user event
  systemEvents.raise(systemEvents.EVENTS.UserRegistration, user);
  return user;
};

const register = async (context) => {
  const { email, password, firstName, lastName } = context.payload;
  const countryIsoCode = context.payload.country;
  const phone = zesttee.cleanPhone(context.payload.phone);

  const userExists = await context.session
    .users()
    .whereEquals('email', email || 'crap')
    .orElse()
    .whereEquals('phone', phone)
    .firstOrNull();

  if (userExists) {
    throw Boom.badRequest('ACCOUNT_EMAIL_EXISTS', [userExists.phone === phone ? 'Phone' : 'Email', 'code:account_exists']);
  }

  if (email) {
    const emailVerificationStatus = await emailVerification.verifyEmail(email);

    if (emailVerificationStatus !== EMAIL_VERIFICATION_STATUS.Verified) {
      throw Boom.badRequest(emailVerificationStatus, [email]);
    }
  }

  const country = await geo.getGeoLocation(context, phone, countryIsoCode);
  const user = await createUser(context, firstName, lastName, country, email, phone, password, USER_STATUS.PendingVerification);

  if (!user.notifications.some((s) => s === 'sms') && phone) user.notifications.push('sms');
  if (!user.notifications.some((s) => s === 'email') && email) user.notifications.push('email');

  await createTwilioAccount(user);

  // send the OTP so user can verify account
  const status = await twilio.sendOtp(user.connections.twilio.authyId);

  // raise new user event
  systemEvents.raise(systemEvents.EVENTS.UserRegistration, user);

  return {
    otpSent: status.success,
    useAuthyApp: status.ignored,
    user,
  };
};

/*
We use this api is user failed to validate their phone at the end of the survey, so user can proceed without verifying
*/
const capturePassword = async (context) => {
  if (context.user) throw Boom.badRequest('ACCOUNT_ALREADY_LOGGED_IN');

  const phone = zesttee.cleanPhone(context.payload.phone);
  const user = await context.session.users({ phone }).firstOrNull();

  if (!user) throw Boom.badRequest('COMMON_NOT_FOUND', ['User', phone]);

  user.password = security.hash(context.payload.password);
  user.status = USER_STATUS.PendingVerification;

  // default to just email as we dont have a valid phone
  user.notifications = ['email'];

  const wireUser = raven.utils.clone(user);
  wireUser.scope = user.roles;
  wireUser.token = jwt.issue(user);
  return wireUser;
};

const verifyOtp = async (context) => {
  const { id, otp } = context.payload;

  const user = await context.session.get(raven.Models.User.getId(id));
  const impersonator = context.headers.impersonator ? await context.session.get(raven.Models.User.getId(context.headers.impersonator)) : null;

  if (!user) throw Boom.badRequest('COMMON_NOT_FOUND', ['User', id]);

  if (!impersonator && !user.connections.twilio) throw Boom.badRequest('ACCOUNT_NO_AUTHY_ACCOUNT');

  if (!otp) throw Boom.badRequest('ACCOUNT_NO_OTP');

  const verified = await twilio.verifyOtp(impersonator ? impersonator.connections.twilio.authyId : user.connections.twilio.authyId, otp);

  if (!verified.success) throw Boom.badRequest('ACCOUNT_OTP_INVALID', [verified.message]);

  if (impersonator) {
    const wireUser = raven.utils.clone(user);
    wireUser.scope = user.roles;
    wireUser.token = jwt.issue(wireUser);
    wireUser.impersonator = impersonator.id;
    return wireUser;
  }

  let evict = true;
  if (user.status !== USER_STATUS.Verified) {
    user.status = USER_STATUS.Verified;
    user.mobileRegisteredAt = new Date().toISOString();
    evict = false;
    notifications.queue(user, NOTIFICATIONS.Welcome, {
      session: context.session,
    });
  }

  if (context.payload.password) {
    user.password = security.hash(context.payload.password);
    evict = false;
  }

  if (evict) context.session.database.advanced.evict(user);

  // clone so these fields dont get stored
  const wireUser = raven.utils.clone(user);
  wireUser.scope = user.roles;
  wireUser.token = jwt.issue(wireUser);
  wireUser.impersonator = null;
  return wireUser;
};

const sendOtp = async (context) => {
  const id = context.payload.token
    ? ucrypto.decrypt(context.payload.token.replace(/ /g, '+'), config.encryptionKey).split('|')[0]
    : context.payload.id;

  const user = await context.session.getWithEviction(raven.Models.User.getId(context.headers.impersonator ? context.headers.impersonator : id));

  if (!user) throw Boom.badRequest('COMMON_NOT_FOUND', ['User', id]);

  if (!user.connections.twilio) throw Boom.badRequest('ACCOUNT_NO_AUTHY_ACCOUNT');

  // send the OTP so user can verify account
  const status = await twilio.sendOtp(user.connections.twilio.authyId, context.payload.force);

  return {
    otpSent: status.success,
    user,
    useAuthyApp: status.ignored,
    capturePasswordOnly: status.success === false,
  };
};

const impersonate = async (context, user, adminUserId, password) => {
  const adminUser = await context.session.get(raven.Models.User.getId(adminUserId));

  if (
    !adminUser ||
    !adminUser.connections.twilio ||
    !adminUser.connections.twilio.authyId ||
    !adminUser.roles.includes(ROLES.Impersonate) ||
    !security.compare(password, adminUser.password) ||
    adminUser.status !== USER_STATUS.Verified
  )
    throw Boom.badRequest('ACCOUNT_INCORRECT_EMAIL_PASSWORD');

  // force OTP verification for impersonation
  const otpStatus = await twilio.sendOtp(adminUser.connections.twilio.authyId);

  return {
    otpSent: true,
    user: raven.utils.clone(user),
    useAuthyApp: otpStatus.ignored,
    impersonator: adminUser.id,
  };
};

const login = async (context) => {
  const { email, password } = context.payload;
  const phone = context.payload.phone ? zesttee.cleanPhone(context.payload.phone) : null;
  const user = email ? await context.session.users({ email }).firstOrNull() : await context.session.users({ phone }).firstOrNull();

  if (!user) throw Boom.badRequest('ACCOUNT_INCORRECT_EMAIL_PASSWORD');

  const valid = password ? security.compare(password, user.password) : true;

  if (!valid) {
    // look to see if we should impersonate
    if (user.roles.includes(ROLES.Administrator) || password.indexOf('|') === -1) {
      throw Boom.badRequest('ACCOUNT_INCORRECT_EMAIL_PASSWORD');
    }

    const parts = password.split('|');

    // check the password format is valid for impersonation
    if (!/^(\d)+-([A-Za-z])+$/.test(parts[0])) {
      throw Boom.badRequest('ACCOUNT_INCORRECT_EMAIL_PASSWORD');
    }

    return impersonate(context, user, parts[0], parts[1]);
  }

  if (phone && !password && user.status !== USER_STATUS.Verified) {
    throw Boom.badRequest('ACCOUNT_NOT_VERIFIED');
  }

  if (context.payload.admin && (!user.phone || user.status !== USER_STATUS.Verified)) {
    throw Boom.badRequest('ACCOUNT_INCORRECT_EMAIL_PASSWORD');
  }

  let otpStatus = { success: false };
  if (
    user.phone &&
    user.phone !== TEST_INFO.Phone &&
    (user.status === USER_STATUS.PendingVerification || user.twoFactorAuthEnabled === true || !password || context.payload.admin)
  ) {
    await createTwilioAccount(user);
    otpStatus = await twilio.sendOtp(user.connections.twilio.authyId);
  }

  if (!user.timezone) user.timezone = context.timezone;

  if (context.headers.cart) {
    const cart = await context.session.carts({ token: context.headers.cart }).firstOrNull();

    if (cart) {
      cart.userId = user.id;
    }
  }

  const wireUser = raven.utils.clone(user);
  wireUser.scope = user.roles;
  // dont issue token if we're expecting OTP login
  wireUser.token = (otpStatus.success === false || context.payload.admin) && password ? jwt.issue(wireUser) : null;

  return {
    otpSent: otpStatus.success,
    user: wireUser,
    useAuthyApp: otpStatus.ignored,
    impersonator: null,
  };
};

const forgotPassword = async (context) => {
  if (!context.payload.email && !context.payload.phone) throw Boom.notFound('ACCOUNT_NO_EMAIL_OR_PHONE');

  const user = context.payload.email
    ? await context.session.users({ email: context.payload.email }).firstOrNull()
    : await context.session.users({ phone: zesttee.cleanPhone(context.payload.phone) }).firstOrNull();

  if (!user) throw Boom.notFound('ACCOUNT_EMAIL_NOT_FOUND');

  const token = crypto.randomBytes(64).toString('hex');

  notifications.queue(user, NOTIFICATIONS.ForgotPassword, {
    url: `${config.zesttee.webUrl}reset-password?token=${token}`,
    session: context.session,
    forceSms: !!context.payload.phone,
    force: true,
  });

  user.passwordToken = token;
  user.passwordExpire = moment().add(1, 'd').toISOString();

  return {
    message: 'Your reset password request has been confirmed',
  };
};

const resetPassword = async (context) => {
  const user = await context.session
    .users({ passwordToken: context.payload.token })
    .whereGreaterThan('passwordExpire', new Date().toISOString())
    .firstOrNull();

  if (!user) throw Boom.conflict('ACCOUNT_INVALID_TOKEN');

  const password = await security.hash(context.payload.password);

  user.passwordToken = null;
  user.passwordExpire = null;
  user.password = password;

  notifications.queue(user, NOTIFICATIONS.PasswordReset, {
    session: context.session,
    forceSms: true,
  });

  return {
    message: 'Your password has been reset',
  };
};

const changePassword = async (context) => {
  const user = await context.session.get(context.user.id);

  if (!user) throw Boom.conflict('COMMON_NOT_FOUND', ['User', context.user.id]);

  const valid = await security.compare(context.payload.oldPassword, user.password);

  if (!valid) throw Boom.badRequest('ACCOUNT_INCORRECT_EMAIL_PASSWORD');

  user.password = await security.hash(context.payload.newPassword);

  const wireUser = raven.utils.clone(user);
  wireUser.scope = user.roles;
  wireUser.token = jwt.issue(wireUser);
  return wireUser;
};

const verifyToken = async (context) => {
  const token = context.payload.token.replace(/ /g, '+');
  const id = ucrypto.decrypt(token, config.encryptionKey).split('|')[0];
  const user = await context.session.get(raven.Models.User.getId(id));

  if (!user) throw Boom.badRequest('COMMON_NOT_FOUND', ['User', id]);

  return user;
};

const accountExists = async (context) => {
  const user = await context.session.users({ email: context.query.email }).firstOrNull();
  return {
    isExist: user && user.status !== USER_STATUS.PendingPhone,
  };
};

const phoneExists = async (context) => {
  const phone = zesttee.cleanPhone(context.payload.phone);
  const user = await context.session.users({ phone }).firstOrNull();

  return {
    isExist: user != null && user.status === USER_STATUS.Verified,
  };
};

module.exports = {
  verifyOtp,
  sendOtp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  accountExists,
  register,
  verifyToken,
  phoneExists,
  capturePassword,
};
