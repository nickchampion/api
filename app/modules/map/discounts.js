const raven = require('../ravendb');

const discount = (source) => {
  return {
    id: raven.utils.friendlyId(source.id),
    code: source.code,
    type: source.type,
    status: source.status,
    tags: source.tags,
    countries: source.countries,
    startsAt: source.startsAt,
    endsAt: source.endsAt,
    usageCount: source.usageCount,
    usageCountPerUser: source.usageCountPerUser,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    updatedByUserId: raven.utils.friendlyId(source.updatedByUserId),
    restrictions: source.restrictions,
  };
};

const discounts = (source) => {
  return source.map((i) => discount(i));
};

module.exports = {
  discount,
  discounts,
};
