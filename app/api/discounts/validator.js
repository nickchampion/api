const Joi = require('@hapi/joi');
const { pathId, searchParams } = require('../../utils/validation');

exports.pathId = pathId;

exports.create = {
  code: Joi.string()
    .regex(/^[a-zA-Z0-9_$%]+$/)
    .required()
    .description('The code you entered not invalid, please use A-Z -0-9, _, $ or % characters only'),
  effect: Joi.string().required(),
  tags: Joi.array().optional().items(Joi.string()),
  countries: Joi.array()
    .required()
    .items({
      minCartValue: Joi.number().min(1).optional().allow(null),
      fixedAmount: Joi.number().min(1).optional().allow(null),
      percentage: Joi.number().min(0).max(100).optional().allow(null),
      country: Joi.string().required(),
      description: Joi.string().required(),
      freeShipping: Joi.bool().optional().default(false),
      creditsExpiryDays: Joi.number().optional().allow(null),
    }),
  restrictions: Joi.object({
    maxQuantity: Joi.number().min(1).optional().allow(null),
    filters: Joi.array().items({
      source: Joi.string().required(),
      operator: Joi.string().required(),
      field: Joi.string().required(),
      values: Joi.array().required(),
    }),
  }).required(),
  startsAt: Joi.date().required(),
  endsAt: Joi.date().required(),
  usageCount: Joi.number().min(1).optional().allow(null).default(null),
  usageCountPerUser: Joi.number().min(1).optional().allow(null).default(null),
  firstOrderOnly: Joi.bool().optional().allow(null).default(null),
  affiliate: Joi.bool().optional().default(false),
};

exports.patch = {
  code: Joi.string()
    .regex(/^[a-zA-Z0-9_$%]+$/)
    .optional()
    .description('The code you entered not invalid, please use A-Z -0-9, _, $ or % characters only'),
  effect: Joi.string().optional(),
  tags: Joi.array().optional().items(Joi.string()),
  countries: Joi.array()
    .optional()
    .items({
      minCartValue: Joi.number().min(1).optional().allow(null),
      fixedAmount: Joi.number().min(1).optional().allow(null),
      percentage: Joi.number().min(0).max(100).optional().allow(null),
      country: Joi.string().required(),
      description: Joi.string().required(),
      freeShipping: Joi.bool().optional().default(false),
      creditsExpiryDays: Joi.number().optional().allow(null),
    }),
  restrictions: Joi.object({
    maxQuantity: Joi.number().min(1).optional().allow(null),
    filters: Joi.array().items({
      source: Joi.string().required(),
      operator: Joi.string().required(),
      field: Joi.string().required(),
      values: Joi.array().required(),
    }),
  }).optional(),
  startsAt: Joi.date().optional(),
  endsAt: Joi.date().optional(),
  usageCount: Joi.number().min(1).optional().allow(null).default(null),
  usageCountPerUser: Joi.number().min(1).optional().allow(null).default(null),
  firstOrderOnly: Joi.bool().optional().allow(null).default(null),
  affiliate: Joi.bool().optional().default(false),
};

exports.searchParams = searchParams;
