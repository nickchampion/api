const Joi = require('@hapi/joi');
const { queryParams, searchParams, checkToken } = require('../../utils/validation');

exports.queryParams = queryParams;
exports.searchParams = searchParams;
exports.checkToken = checkToken;
exports.idParam = Joi.string().required().description('id is required');

exports.createProduct = {
  name: Joi.string().required(),
  url: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  price: Joi.number().optional(),
  prices: Joi.object().keys().unknown(true).optional(),
  inventory: Joi.number().optional(),
  variants: Joi.object().keys().unknown(true).optional(),
  images: Joi.object().keys({
    ingredient: Joi.string(),
    background: Joi.string(),
    primary: Joi.string(),
  }),
};

exports.updateProduct = {
  name: Joi.string(),
  url: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  price: Joi.number().optional(),
  prices: Joi.object().keys().unknown(true).optional(),
  inventory: Joi.number().optional(),
  variants: Joi.object().keys().unknown(true).optional(),
  images: Joi.object().keys({
    ingredient: Joi.string(),
    background: Joi.string(),
    primary: Joi.string(),
  }),
};

exports.batchUpdate = Joi.array().items(
  Joi.object({
    id: Joi.string().required(),
    inventory: Joi.number().optional(),
    cogs: Joi.number().required(),
    packagingId: Joi.number().integer().positive().required(),
  }),
);
