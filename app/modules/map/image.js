const raven = require('../ravendb');

const image = (source) => {
  return {
    id: raven.utils.friendlyId(source.id),
    type: source.type,
    url: source.url,
    name: source.name,
    size: source.size,
    linkedTo: source.linkedTo,
    createdAt: source.createdAt,
  };
};

const images = (source) => {
  return source.map((i) => image(i));
};

module.exports = {
  image,
  images,
};
