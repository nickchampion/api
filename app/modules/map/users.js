const raven = require('../ravendb');

const user = (source) => {
  return {
    id: raven.utils.friendlyId(source.id),
    firstName: source.firstName,
    lastName: source.lastName,
    email: source.email,
    dob: source.dob,
    gender: source.gender,
    affiliateId: source.affiliateId,
    country: source.country,
    status: source.status,
    identity: source.identity,
    identityName: source.identityName,
    phone: source.phone,
    connections: source.connections,
    roles: source.roles,
    notifications: source.notifications,
    createdAt: source.createdAt,
    twoFactorAuthEnabled: source.twoFactorAuthEnabled,
    completeSurveys: source.completeSurveys,
    campaign: source.campaign.id ? source.campaign.id : null,
    source: source.campaign.source ? source.campaign.source : null,
    campaignInfo: source.campaign.id ? `${source.campaign.medium}; ${source.campaign.content}` : null,
  };
};

const users = (source) => {
  if (source.results) {
    source.results = source.results.map((u) => user(u));
    return source;
  }

  return source.map((u) => user(u));
};

module.exports = {
  user,
  users,
};
