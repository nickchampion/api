const round = (num, decimalPlaces = 2) => {
  return parseFloat(num.toFixed(decimalPlaces));
};

const roundUp = (num) => {
  return Math.ceil(round(num));
};

const inversePercentage = (num, percent) => {
  return num * ((100 - percent) / 100);
};

const percentage = (num, percent) => {
  return num * (percent / 100);
};

const percentageOf = (part, total) => {
  return round((part / total) * 100);
};

const isNumeric = (n) => {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports = {
  round,
  roundUp,
  inversePercentage,
  percentage,
  isNumeric,
  percentageOf,
};
