const cartJobs = require('../../modules/cart/tasks');

module.exports = async () => {
  await cartJobs.sendCartReminders();
};
