const { PatchByQueryOperation } = require('ravendb');
const Boom = require('@hapi/boom');
const config = require('../../modules/configuration').config();
const raven = require('../../modules/ravendb');
const users = require('../../modules/users');

class TestController {
  async prepare(request) {
    if (config.production) throw Boom.notFound();

    // hard delete test user
    const user = await request.context.session.users({ email: 'automated-tests@zesttee.com' }).firstOrNull();

    if (user) await users.hardDelete(request.context, user.id);

    // make sure we've enough stock
    const patch = new PatchByQueryOperation(`
      from index 'Products'
      update {
        this.inventory = 10000
      }`);

    const operation = await raven.store.operations.send(patch);
    await operation.waitForCompletion();

    // wait for 5 seconds for indexes etc after we've updated the user
    request.context.session.addCommitAction(async () => {
      await raven.utils.sleep(5000);
    });

    return {
      success: true,
    };
  }

  async init(request) {
    if (config.production) throw Boom.notFound();

    const user = await request.context.session.users({ email: 'automated-tests@zesttee.com' }).firstOrNull();

    if (user) user.roles = ['administrator'];

    // wait for 5 seconds for indexes etc after we've updated the user
    request.context.session.addCommitAction(async () => {
      await raven.utils.sleep(5000);
    });

    return {
      success: true,
    };
  }
}

module.exports = TestController;
