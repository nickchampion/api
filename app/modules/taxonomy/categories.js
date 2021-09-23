const _ = require('lodash');
const raven = require('../ravendb');
const cache = require('../cache');
const common = require('./common');
const { CACHE_KEYS, SINGLETONS } = require('../../constants');

const getCategories = async (parentId) => {
  return cache.get(`${CACHE_KEYS.Categories}-${parentId}`, async () => {
    const session = new raven.Session();
    let categories = await session.database.load(SINGLETONS.Categories);
    categories = _.orderBy(
      categories.categories.filter((c) => c.isActive),
      (c) => c.name,
    );
    return categories;
  });
};

const getCategory = async (parentId, idOrSlug) => {
  if (!idOrSlug) return null;

  const categories = await getCategories(parentId);
  const slugPattern = new RegExp('^[a-z](-?[a-z])*$');

  if (slugPattern.test(idOrSlug)) return categories.find((c) => c.slug === idOrSlug);
  return categories.find((c) => c.id === parseInt(idOrSlug));
};

const getParentCategories = async () => {
  const config = await common.getSingleton(SINGLETONS.Configuration);
  return config.categories;
};

module.exports = {
  getCategories,
  getCategory,
  getParentCategories,
};
