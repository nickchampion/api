const user = {
  id: id(this),
  firstName: this.firstName,
  lastName: this.lastName,
  email: this.email,
  createdAt: this.createdAt,
  mobileRegisteredAt: this.mobileRegisteredAt,
  dob: this.dob,
  gender: this.gender,
  country: this.country,
  status: this.status,
  phone: this.phone,
  roles: this.roles.join(', '),
  notifications: this.notifications.join(', '),
  identityId: this.identity,
  identityName: this.identityName,
  affiliateId: this.affiliateId,
};

loadTousers(user);
