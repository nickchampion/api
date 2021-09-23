const raven = require('../../modules/ravendb');
const map = require('../../modules/map');
const { ALERT_STATUS } = require('../../constants');

class AuditController {
  async query(request) {
    request.query.orderBy = '-createdAt';
    const page = await request.context.session.search(raven.Models.Audit);
    page.results = map.audits(page.results);
    return page;
  }

  async delete(request) {
    const alert = await request.context.session.get(raven.Models.Alert.getId(request.params.id));

    if (alert) alert.status = ALERT_STATUS.Dismissed;

    return {
      success: true,
    };
  }
}

module.exports = AuditController;
