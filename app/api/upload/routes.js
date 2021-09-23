const Joi = require('@hapi/joi');
const UploadController = require('./controller');

const controller = new UploadController();
const { checkToken } = require('../../utils/validation');

const Routes = [
  {
    method: 'POST',
    path: '/api/upload',
    config: {
      description: 'Upload a file to Azure',
      handler: controller.upload.bind(controller),
      auth: false,
      validate: {
        headers: checkToken,
      },
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 2 * 1000 * 1000,
        multipart: true,
      },
      timeout: {
        server: 600000,
        socket: 600001,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/export/{id}',
    config: {
      description: 'Export data',
      handler: controller.export.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: checkToken,
        params: Joi.required().description('export type is required'),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/deleteImage',
    config: {
      description: 'Delete image by URL',
      handler: controller.deleteFile.bind(controller),
      auth: 'jwt',
      validate: {
        headers: checkToken,
        payload: {
          url: Joi.string().required(),
        },
      },
    },
  },
];

module.exports = Routes;
