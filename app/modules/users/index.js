const cache = require('../cache');
const raven = require('../ravendb');
const config = require('../configuration').config();
const map = require('../map');
const { SINGLETONS } = require('../../constants');

const getRoles = async () => {
  return cache.get('roles', async () => {
    const session = new raven.Session();
    return session.get(SINGLETONS.Roles);
  });
};

const get = async (request, id) => {
  const user = await request.context.session.get(raven.Models.User.getId(id));
  return user ? map.user(user) : null;
};

const query = async (context, predicate) => {
  const page = await context.session.search(raven.Models.User, null, predicate);
  page.results = map.users(page.results);
  return page;
};

const patch = async (request, id, patchData) => {
  patchData.id = raven.Models.User.getId(id);
  patchData.updatedAt = new Date().toISOString();
  const user = await request.context.session.patch(patchData);
  return map.user(user);
};

const getRoleForUser = async () => {
  const roles = await getRoles();
  return roles.find((r) => r.name === 'user');
};

const hardDelete = async (context, id, force = false) => {
  if (config.production && force === false) return;

  const user = await context.session.get(raven.Models.User.getId(id));

  if (user) {
    const orders = await context.session.orders({ userId: user.id }).all();
    const carts = await context.session.carts({ userId: user.id }).all();

    await Promise.all(orders.map((o) => context.session.delete(raven.Models.Refund.getId(o.id))));
    await Promise.all(orders.map((e) => context.session.delete(e)));
    await Promise.all(carts.map((e) => context.session.delete(e)));

    if (force === false) {
      await context.session.delete(raven.Models.AddressBook.getId(user.id));
      await context.session.delete(user);
    }
  }
};

module.exports = {
  getRoles,
  getRoleForUser,
  get,
  patch,
  query,
  hardDelete,
};
