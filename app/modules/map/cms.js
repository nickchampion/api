const raven = require('../ravendb');

const cms = (source) => {
  return {
    id: raven.utils.friendlyId(source.id),
    locale: source.locale,
    title: source.title,
    slug: source.slug,
    country: source.country,
    openGraph: source.openGraph,
    type: source.type,
    content: source.content,
    status: source.status,
    publishedAt: source.publishedAt,
    isActive: source.isActive,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    path: source.path,
    updateBy: source.updateBy,
  };
};

const cmss = (source) => {
  return source.map((i) => cms(i));
};

module.exports = {
  cms,
  cmss,
};
