const map = require('../../modules/map');
const { ALERT_STATUS } = require('../../constants');

exports.dashboard = async (request) => {
  const countProduct = request.context.session.products().countLazily();
  const countCustomer = request.context.session.users().countLazily();
  const countOrder = request.context.session.orders().countLazily();
  const alertsQuery = request.context.session.alerts({ status: ALERT_STATUS.Active }).lazily();

  const alerts = await alertsQuery.getValue();

  const result = {
    customerCount: await countCustomer.getValue(),
    orderCount: await countOrder.getValue(),
    productCount: await countProduct.getValue(),
    alerts: map.alerts(alerts),
  };

  return result;
};
