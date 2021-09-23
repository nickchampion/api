const urls = require('../../utils/urls');

const category = (c, locale = 'en') => {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ? c.description[locale] : null,
    displayName: c.displayName ? c.displayName[locale] : null,
    icon: c.icon,
    isActive: c.isActive,
    url: urls.category(c.slug),
  };
};

const categories = (source, locale = 'en') => {
  return source.map((c) => category(c, locale));
};

module.exports = {
  categories,
  category,
};
