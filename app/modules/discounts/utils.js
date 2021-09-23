const R = require('ramda');
const math = require('../../utils/math');
const raven = require('../ravendb');

const subTotal = (items) => {
  return R.pipe(
    R.map((i) => (i.quantity || 1) * i.price),
    R.sum,
    math.round,
  )(items);
};

const sumByTotal = (appliedDiscounts) => {
  return R.pipe(
    R.map((i) => i.total),
    R.sum,
    math.round,
  )(appliedDiscounts);
};

const creditsTotal = (cartDiscounts) => {
  return R.pipe(
    R.map((i) => i.credits || 0),
    R.sum,
    math.round,
  )(cartDiscounts);
};

const roundPercentage = (amount, percentage) => {
  return R.pipe(math.percentage, math.round)(amount, percentage);
};

const calculateSingleQtySalePrice = (item) => {
  const discountTotal = R.pipe(
    R.flatten, // flatten into single dimensional array
    R.map((i) => i.amount),
    R.sum,
    math.round,
  )(item.discounts.applied);

  return item.price - discountTotal;
};

const discountTotal = (itemDiscounts, cartDiscounts) => {
  // map and flatten the item discounts so the array structure matches the cartDiscounts structure
  const items = R.compose(
    R.flatten, // flatten into single dimensional array
    R.map((v) => v.discounts.applied),
  )(itemDiscounts);

  return R.compose(
    math.round,
    R.sum, // sum up
    R.map((i) => i.total), // extract total
    R.concat, // combine both discount arrays
  )(items, cartDiscounts.applied);
};

const extractAffiliateInfo = (code) => {
  try {
    const parts = code.split('-');
    const uid = parts[1];
    const id = raven.Models.User.getId(`${uid.substring(1, uid.length - 2)}-${uid[uid.length - 1]}`);

    return {
      userId: id,
      code: parts[0],
    };
  } catch {
    return null;
  }
};

module.exports = {
  sumByTotal,
  subTotal,
  discountTotal,
  roundPercentage,
  calculateSingleQtySalePrice,
  creditsTotal,
  extractAffiliateInfo,
};
