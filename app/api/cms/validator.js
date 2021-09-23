const Joi = require('@hapi/joi');
const { queryParams, checkToken, searchParams } = require('../../utils/validation');

exports.queryParams = queryParams;
exports.searchParams = searchParams;
exports.checkToken = checkToken;

exports.idParam = Joi.string().required().description('id is required');

exports.createCms = {
  locale: Joi.string(),
  type: Joi.string(),
  path: Joi.string().required(),
  slug: Joi.string(),
  title: Joi.string().required(),
  country: Joi.string().required(),
  openGraph: Joi.object().optional().allow(null),
  content: Joi.object(),
  status: Joi.string().allow('draft', 'published').default('draft'),
};

exports.updateCms = {
  locale: Joi.string(),
  title: Joi.string(),
  country: Joi.string().required(),
  type: Joi.string(),
  path: Joi.string().required(),
  slug: Joi.string(),
  openGraph: Joi.object().optional().allow(null),
  content: Joi.object(),
  isActive: Joi.boolean(),
  status: Joi.string().allow('draft', 'published'),
};

exports.pathQuery = {
  path: Joi.string().required(),
};

exports.sync = Joi.object({
  path: Joi.string().required(),
  doc: Joi.object().required().options({ allowUnknown: true }),
  userId: Joi.string().required(),
});
