const moment = require('moment');

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function dayDifference(date1, date2) {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(timeDiff / MILLISECONDS_PER_DAY);
  return diffDays;
}

const toTimezoneFormat = (date, timezone, format) => {
  if (!date) return null;
  const offset = timezone < 0 ? Math.abs(timezone) : timezone === 0 ? 0 : -Math.abs(timezone);
  return moment(date).utcOffset(offset).format(format);
};

const toTimezone = (timezone, date) => {
  const dt = date || moment.now();
  const offset = timezone < 0 ? Math.abs(timezone) : timezone === 0 ? 0 : -Math.abs(timezone);
  return moment(dt).utcOffset(offset);
};

const withinRange = (startUtc, endUtc) => {
  if (!startUtc || !endUtc) return false;
  return moment.utc().isBetween(moment.utc(startUtc), moment.utc(endUtc));
};

module.exports = {
  dayDifference,
  toTimezone,
  toTimezoneFormat,
  withinRange,
};
