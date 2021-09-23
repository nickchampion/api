const taxonomy = require('./taxonomy');
const urls = require('../../utils/urls');
const math = require('../../utils/math');
const raven = require('../ravendb');

const extractCategories = (categoryIds, categories) => {
  const result = [];

  categoryIds.forEach((id) => {
    const category = categories.find((c) => c.id === id);
    if (category) result.push(taxonomy.category(category));
  });

  return result;
};

const kit = (context, source) => {
  if (!source.copy || !source.metadata) return null;

  const copy = source.copy[context.locale];

  return {
    id: raven.utils.friendlyId(source.id),
    name: copy.name,
    description: copy.description,
    tests: source.metadata.tests.map((t) => {
      return {
        id: t.id,
        description: t.description[context.locale],
        name: t.name,
        gender: t.gender,
      };
    }),
    gender: source.metadata.gender,
    image: source.images.primary,
    price: context.utils.formatPrice(source.prices),
    externalId: source.externalId ? source.externalId.split('-')[1] : null,
    url: urls.product(source),
    slug: source.slug,
    productType: source.productType,
    prices: source.prices,
    numericPrice: context.utils.price(source.prices),
    currency: context.country.currency,
  };
};

const kits = (context, source) => {
  return source.map((k) => kit(context, k)).filter((k) => k);
};

const variants = (context, vs) => {
  if (vs && vs.length > 0) {
    return vs.map((v) => {
      return {
        id: v.id,
        price: context.utils.formatPrice(v.prices),
        size: v.size,
        cogs: v.cogs,
      };
    });
  }

  return [];
};

const product = (context, p, categories, category) => {
  let bullets = p.bullets
    ? p.bullets.map((b) => {
        return { title: b };
      })
    : [];

  if (category && category.bullets) {
    const categoryBullets = category.bullets.find((b) => b.id === p.externalId);

    if (categoryBullets && categoryBullets.bullets[context.locale])
      bullets = categoryBullets.bullets[context.locale].map((e) => {
        return { title: e };
      });
  }

  return {
    id: raven.utils.friendlyId(p.id),
    externalId: p.externalId ? p.externalId.split('-')[1] : null,
    name: p.name,
    slug: p.slug,
    bullets,
    price: context.utils.formatPrice(p.prices),
    daily: context.utils.formatDailyPrice(p.prices),
    categories: extractCategories(p.categoryIds, categories),
    image: p.images ? p.images.primary : null,
    images: p.images,
    url: urls.product(p, categories),
    productType: p.productType,
    variants: variants(context, p.variants),
    description: p.description,
    prices: p.prices,
    numericPrice: context.utils.price(p.prices),
    currency: context.country.currency,
  };
};

const products = (context, source, categories, category) => {
  return source.map((p) => product(context, p, categories, category));
};

const productDetails = (context, p, details, categories) => {
  const basic = product(context, p, categories, null);
  const copy = details.copy ? details.copy[context.locale] : {};

  return Object.assign(basic, {
    desc: copy.description,
    how: copy.how,
    research: copy.research,
    warnings: copy.warnings,
    ingredients: copy.ingredients,
    dosage: details.metadata.dosage,
    dosageType: details.metadata.dosageType,
    notContaining: copy.doesNotContain,
    preg: details.metadata.pregnant,
    lact: details.metadata.lactating,
    stomach: details.metadata.stomach,
    references: details.references || copy.references,
    summaries: copy.summaries,
  });
};

const adminProduct = (p) => {
  return {
    id: raven.utils.friendlyId(p.id),
    name: p.name,
    url: p.url,
    productType: p.productType,
    cogs: `${p.cogs} SGD`,
    packagingId: p.packagingId,
    externalId: p.externalId ? p.externalId.split('-')[1] : null,
    slug: p.slug,
    price: p.prices ? p.prices.SG : p.price,
    prices: p.prices,
    dailyPrice: math.round((p.prices ? p.prices.SG : p.price) / 30),
    images: p.images,
    inventory: p.inventory,
    variants: p.variants || [],
    isActive: p.isActive,
  };
};

const adminProducts = (source) => {
  return source.map((p) => adminProduct(p));
};

module.exports = {
  adminProducts,
  adminProduct,
  products,
  product,
  productDetails,
  kits,
  kit,
};
