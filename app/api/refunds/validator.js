const _ = require('lodash');
const Joi = require('@hapi/joi');
const { queryParams, checkToken, searchParams, pathId } = require('../../utils/validation');
const { REFUND_STATUS } = require('../../constants');

exports.queryParams = queryParams;
exports.searchParams = searchParams;
exports.checkToken = checkToken;
exports.pathId = pathId;

exports.updateRefund = {
  status: Joi.string().valid(..._.map(REFUND_STATUS, (o) => o)),
  items: Joi.array().items(Joi.number()),
};
