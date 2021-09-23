const raven = require('../ravendb');

const alert = (alt) => {
  return {
    id: raven.utils.friendlyId(alt.id),
    type: alt.type,
    description: alt.description,
    data: alt.data,
    status: alt.status,
    createdAt: alt.createdAt,
    dismissedAt: alt.dismissedAt,
  };
};

const alerts = (alts) => {
  return alts.map((i) => alert(i));
};

module.exports = {
  alert,
  alerts,
};
