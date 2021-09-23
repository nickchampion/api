const Joi = require('@hapi/joi');
const { queryParams, checkToken, searchParams, pathId } = require('../../utils/validation');

exports.queryParams = { ...queryParams, q: Joi.string() };
exports.searchParams = searchParams;
exports.checkToken = checkToken;
exports.pathId = pathId;

exports.rolePayload = {
  role: Joi.string(),
};
