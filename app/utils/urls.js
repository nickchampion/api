const slug = require('slug');
const { PRODUCT_TYPES, PRODUCT_CATEGORIES } = require('../constants');

const product = (prod, categories) => {
  if (prod.url) return prod.url;

  switch (prod.productType || prod.type) {
    case PRODUCT_TYPES.TestKit:
      // #HACK, need some way of identifying vertical so we sont have to do this
      if (prod.name.toLowerCase().indexOf('male') > -1 || prod.name.toLowerCase().indexOf('testosterone') > -1)
        return `/sexual-health/${slug(prod.name.replace(' Test', '')).toLowerCase()}`;

      return `/home-lab-tests/${slug(prod.name.replace(' Test', '')).toLowerCase()}`;
    case PRODUCT_TYPES.Supplement:
      return `/supplements/${slug(prod.name).toLowerCase()}`;
    case PRODUCT_TYPES.Medication: {
      if (prod.categories && prod.categories.includes(PRODUCT_CATEGORIES.HairLoss)) return `/hairloss/${slug(prod.name).toLowerCase()}`;
      return `/sexual-health/${slug(prod.name).toLowerCase()}`;
    }
    case PRODUCT_TYPES.Pack: {
      if (!categories) return null;

      const categoryId =
        prod.metadata && prod.metadata.categoryIds && prod.metadata.categoryIds.length > 0
          ? prod.metadata.categoryIds[0]
          : prod.categoryIds && prod.categoryIds.length > 0
          ? prod.categoryIds[0]
          : null;

      const category = categoryId ? categories.find((c) => c.id === categoryId) : null;

      return category ? `/daily-health/packs/${category.slug}` : null;
    }
    default:
      return null;
  }
};

const category = (slg) => {
  return `/daily-health/packs/${slg}`;
};

const getFilename = (url) => {
  let modurl = url.split('?')[0];
  modurl = modurl.split('/');
  return modurl[modurl.length - 1];
};

const getFilenameWithoutExtension = (url) => {
  let modurl = url.split('?')[0];
  modurl = modurl.split('/');
  modurl = modurl[modurl.length - 1];
  return modurl.split('.')[0];
};

const getFileExtension = (url, fallback) => {
  let modurl = getFilename(url);

  if (modurl.indexOf('.') === -1) return fallback;

  modurl = modurl.split('.');
  return modurl[modurl.length - 1];
};

module.exports = {
  product,
  category,
  getFilename,
  getFileExtension,
  getFilenameWithoutExtension,
};
