const Joi = require('@hapi/joi');
const { queryParams, checkToken, searchParams } = require('../../utils/validation');

exports.queryParams = queryParams;
exports.searchParams = searchParams;
exports.checkToken = checkToken;

exports.idParam = Joi.number().required().description('id is required');

exports.createCategory = {
  name: Joi.string().required(),
  description: Joi.object(),
  displayName: Joi.object(),
  icon: Joi.string(),
};

exports.updateCategory = {
  name: Joi.string().required(),
  description: Joi.object(),
  displayName: Joi.object(),
  icon: Joi.string(),
  isActive: Joi.boolean(),
};
