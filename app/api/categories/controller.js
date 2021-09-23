const Boom = require('@hapi/boom');
const slug = require('slug');
const cache = require('../../modules/cache');
const { SINGLETONS, CACHE_KEYS } = require('../../constants');

class CategoriesController {
  async get(request) {
    const categories = await request.context.session.get(SINGLETONS.Categories);
    return categories.categories.find((c) => c.id === request.params.id);
  }

  async query(request) {
    const categories = await request.context.session.get(SINGLETONS.Categories);

    return {
      results: categories.categories.filter((c) => c.isActive),
      total: categories.categories.filter((c) => c.isActive).length,
    };
  }

  async create(request) {
    const categories = await request.context.session.get(SINGLETONS.Categories);

    const category = {
      id: categories.currentId,
      name: request.payload.name,
      slug: slug(request.payload.name).toLowerCase(),
      displayName: request.payload.displayName,
      description: null,
      icon: request.payload.icon,
      isActive: true,
      bullets: [],
    };

    categories.categories.push(category);
    categories.currentId += 1;

    request.context.session.addCommitAction(async () => {
      cache.del(CACHE_KEYS.Categories);
    });

    return category;
  }

  async patch(request) {
    const categories = await request.context.session.get(SINGLETONS.Categories);
    const category = categories.categories.find((c) => c.id === request.params.id);

    if (category) {
      category.name = request.payload.name;
      category.displayName = request.payload.displayName;
      category.icon = request.payload.icon;
      category.slug = slug(category.name).toLowerCase();

      request.context.session.addCommitAction(async () => {
        cache.del(CACHE_KEYS.Categories);
      });

      return category;
    }

    throw Boom.badRequest('COMMON_NOT_FOUND', ['Category', request.params.id]);
  }

  async delete(request) {
    const categories = await request.context.session.get(SINGLETONS.Categories);
    const category = categories.categories.find((c) => c.id === request.params.id);

    if (category) {
      category.isActive = false;

      request.context.session.addCommitAction(async () => {
        cache.del(CACHE_KEYS.Categories);
      });

      return {
        success: true,
      };
    }

    throw Boom.badRequest('COMMON_NOT_FOUND', ['Category', request.params.id]);
  }
}

module.exports = CategoriesController;
