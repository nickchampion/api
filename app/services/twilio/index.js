/* eslint-disable import/order */

const { promisify } = require('util');
const config = require('../../modules/configuration').config();
const client = require('twilio')(config.twilio.account, config.twilio.token);
const authy = require('authy')(config.twilio.authyApiKey);
const errordite = require('../../modules/errordite');

const authyRegister = promisify(authy.register_user).bind(authy);
const authySendOtp = promisify(authy.request_sms).bind(authy);
const authyVerifyOtp = promisify(authy.verify).bind(authy);

const send = async (to, text) => {
  const from = to.startsWith('+60') ? config.twilio.from : 'Zesttee'; // Malaysia does not support alpha numeric codes

  await client.messages.create({
    body: text,
    from,
    to,
  });
};

const register = async (email, phone) => {
  try {
    const phoneParts = phone.replace('+', '').split(' ');
    return await authyRegister(email, phoneParts[1], phoneParts[0]);
  } catch (e) {
    e.name = 'Twilio:Register';
    e.context = {
      email,
      phone,
    };
    errordite.log(e);
    return {
      success: false,
      message: e.message,
    };
  }
};

const sendOtp = async (authyId) => {
  try {
    // let shouldForceSend = force;

    // if (!shouldForceSend) {
    //   const configuration = await taxonomy.getSingleton(SINGLETONS.Configuration);
    //   shouldForceSend = configuration.twilio.forceSendAuthSms;
    // }

    return await authySendOtp(authyId, true);
  } catch (e) {
    e.name = 'Twilio:SendOtp';
    e.context = {
      authyId,
    };
    errordite.log(e);
    return {
      success: false,
      message: e.message,
    };
  }
};

const verifyOtp = async (authyId, token) => {
  try {
    return await authyVerifyOtp(authyId, token);
  } catch (e) {
    e.name = 'Twilio:VerifyOtp';
    e.context = {
      authyId,
      token,
    };
    errordite.log(e);

    return {
      success: false,
      message: e.message,
    };
  }
};

module.exports = {
  send,
  register,
  sendOtp,
  verifyOtp,
};
