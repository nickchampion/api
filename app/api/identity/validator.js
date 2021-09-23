const Joi = require('@hapi/joi');

const { strEmail, strPassword, strPhoneNumber } = require('../../utils/validation');

exports.login = {
  email: strEmail().optional().allow(null),
  phone: strPhoneNumber().optional(),
  password: strPassword().optional(),
};

exports.register = {
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: strEmail().optional().min(1).max(244).allow(null),
  password: strPassword().required(),
  phone: strPhoneNumber().required(),
  country: Joi.string().required(),
};

exports.forgotPassword = {
  email: strEmail().optional().allow(null),
  phone: strPhoneNumber().optional().allow(null),
};

exports.resetPassword = {
  token: Joi.string().required(),
  password: strPassword().required(),
};

exports.checkToken = {
  token: Joi.string().required(),
};

exports.capturePassword = {
  phone: strPhoneNumber().required(),
  password: strPassword().required(),
};

exports.verifyOtp = {
  otp: Joi.string().optional(),
  id: Joi.string().required(),
  password: strPassword().optional(),
  impersonatorId: Joi.string().optional(),
};

exports.sendOtp = {
  id: Joi.string().optional(),
  token: Joi.string().optional(),
  force: Joi.boolean().optional(),
};

exports.accountExists = {
  email: strEmail().required(),
};

exports.phoneExists = {
  phone: Joi.string().required(),
};

exports.geoLookup = {
  ip: Joi.string().required(),
};
