const moment = require('moment');
const cache = require('../cache');
const utils = require('./utils');
const config = require('../configuration').config();
const datetime = require('../../utils/datetime');
const { DISCOUNT_STATUS } = require('../../constants');

const filterOutOfRange = (discounts) => {
  return discounts.filter((d) => {
    return datetime.withinRange(d.startsAt, d.endsAt);
  });
};

const loadDiscounts = async (context) => {
  const utc = moment.utc();
  let discounts = await context.session
    .discounts()
    .whereEquals('status', DISCOUNT_STATUS.Approved)
    .whereLessThan('startsAt', utc.add(1, 'hour'))
    .whereGreaterThan('endsAt', utc.add(-1, 'hour'))
    .all();

  // evict from session
  discounts.forEach((d) => context.session.database.advanced.evict(d));

  // map the change vector to the discount as we need this on the cart and order for revisions
  discounts = discounts.map((d) => {
    return {
      ...d,
      changeVector: d['@metadata']['@change-vector'],
    };
  });

  return discounts;
};

// find all active discounts
const getActiveDiscounts = async (context) => {
  // get all active discounts
  const discounts = await cache.get('discounts:active', async () => loadDiscounts(context), config.cache.timeouts.halfHour);

  // the above query returns discounts within an hour either side of the start / end date to account for caching
  // so before we return the discounts we need to filter out any that are not actually still active
  return filterOutOfRange(discounts);
};

const getActiveDiscountByCode = async (context, code) => {
  const discounts = await getActiveDiscounts(context);

  // need to handle customer codes which include users ID suffixed to the actual code
  // the code and id is always separated by a hyphen and hyphens are not allowed in discount codes normally
  if (code.indexOf('-') > 0) {
    // extract the affiliate info from the code being used
    const affiliateInfo = utils.extractAffiliateInfo(code);

    // invalid
    if (!affiliateInfo) return null;

    // dont let user use their own affiliate discount code
    if (affiliateInfo.userId === context.user.id) return null;

    // otherwise look for discount with the code and thats an affiliate discount
    return discounts.find((d) => d.code && d.code === affiliateInfo.code && d.affiliate);
  }

  return discounts.find((d) => d.code && d.code === code && !d.affiliate);
};

module.exports = {
  getActiveDiscounts,
  getActiveDiscountByCode,
};
