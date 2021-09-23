const ProductController = require('./controller');
const validator = require('./validator');

const controller = new ProductController();

const Routes = [
  {
    method: 'GET',
    path: '/api/products',
    config: {
      description: 'Get Product admin list',
      handler: controller.query.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        query: validator.searchParams,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/products/{id}',
    config: {
      description: 'Get a Product admin',
      handler: controller.get.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/products/{id}',
    config: {
      description: 'Update Product admin',
      handler: controller.patch.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
        payload: validator.updateProduct,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/products/clone/{id}',
    config: {
      description: 'Clone a product',
      handler: controller.clone.bind(controller),
      auth: {
        strategy: 'jwt',
        scope: ['administrator'],
      },
      validate: {
        headers: validator.checkToken,
        params: {
          id: validator.idParam,
        },
      },
    },
  },
];

module.exports = Routes;
