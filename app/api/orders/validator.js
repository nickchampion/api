const Joi = require('@hapi/joi');
const _ = require('lodash');
const { queryParams, checkToken, searchParams, pathId } = require('../../utils/validation');
const { ORDER_STATUS } = require('../../constants');

exports.queryParams = queryParams;
exports.searchParams = { ...searchParams, userId: Joi.string().optional() };
exports.checkToken = checkToken;
exports.pathId = pathId;

exports.updateOrder = {
  status: Joi.string().valid(..._.map(ORDER_STATUS, (o) => o).concat(['Refund Customer', 'Change Shipping Method'])),
  items: Joi.array().items(Joi.number()),
  allItems: Joi.boolean().required(),
  entity: Joi.string().required(),
  fields: Joi.array()
    .items({
      field: Joi.string(),
      value: Joi.string(),
    })
    .optional(),
};

exports.comment = {
  comment: Joi.string().required(),
};

exports.createOrder = {
  userId: Joi.string().required(),
  orderId: Joi.string().optional().allow(null),
  cartId: Joi.string().optional().allow(null),
  discountCode: Joi.string().optional().allow(null),
  paymentMethodId: Joi.string().optional().allow(null),
  useCredits: Joi.boolean().required(),
};

exports.address = {
  firstName: Joi.string().max(255),
  lastName: Joi.string().max(255),
  address1: Joi.string().max(255),
  address2: Joi.string().allow(null).max(255).optional(),
  city: Joi.string().allow(null).optional(),
  zipcode: Joi.string().max(64),
  stateName: Joi.string().max(255).allow(null).optional(),
};
