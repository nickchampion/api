const { AbstractJavaScriptIndexCreationTask } = require('ravendb');

class Discounts extends AbstractJavaScriptIndexCreationTask {
  constructor() {
    super();
    this.map('Discounts', (discount) => ({
      effect: discount.effect,
      status: discount.status,
      code: discount.code,
      startsAt: discount.startsAt,
      endsAt: discount.endsAt,
      updatedAt: discount.updatedAt,
      createdAt: discount.createdAt,
      countries: discount.countries.Select((c) => c.country),
      patch: discount.patch,
    }));
  }
}

module.exports = new Discounts();
