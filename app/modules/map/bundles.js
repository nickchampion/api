const raven = require('../ravendb');

const bundles = (context, source) => {
  return source.map((bundle) => {
    return {
      name: bundle.name,
      slug: bundle.slug,
      id: raven.utils.friendlyId(bundle.id),
      prices: bundle.prices,
      type: bundle.type,
      inventory: bundle.inventory,
      categoryIds: bundle.categoryIds,
      url: bundle.url,
      image: bundle.image,
      description: bundle.description,
    };
  });
};

module.exports = {
  bundles,
};
