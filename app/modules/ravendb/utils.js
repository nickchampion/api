/* eslint-disable no-param-reassign */
const _ = require('lodash');
const raven = require('.');
const { PRODUCT_TYPES } = require('../../constants');

const query = {
  whereEquals: (q, key, value) => {
    if (q.hasFilter) {
      q = q.andAlso().whereEquals(key, value);
    } else {
      q.hasFilter = true;
      q = q.whereEquals(key, value);
    }
    return q;
  },
  whereNotEquals: (q, key, value) => {
    if (q.hasFilter) {
      q = q.andAlso().whereNotEquals(key, value);
    } else {
      q.hasFilter = true;
      q = q.whereNotEquals(key, value);
    }
    return q;
  },
  whereIn: (q, key, value) => {
    if (q.hasFilter) {
      q = q.andAlso().whereIn(key, Array.isArray(value) ? value : value.split(','));
    } else {
      q.hasFilter = true;
      q = q.whereIn(key, Array.isArray(value) ? value : value.split(','));
    }
    return q;
  },
  whereNotIn: (q, key, value) => {
    if (q.hasFilter) {
      q = q.andAlso().whereNotIn(key, Array.isArray(value) ? value : value.split(','));
    } else {
      q.hasFilter = true;
      q = q.whereNotIn(key, Array.isArray(value) ? value : value.split(','));
    }
    return q;
  },
  whereBetween: (q, key, start, end) => {
    if (q.hasFilter) {
      q = q.andAlso().whereBetween(key, start, end);
    } else {
      q.hasFilter = true;
      q = q.whereBetween(key, start, end);
    }
    return q;
  },
};

const sleep = async (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const page = async (qry, context, limit = 20) => {
  let stats = null;

  const q = qry
    .take(context.query && context.query.limit ? context.query.limit : limit)
    .skip(context.query && context.query.offset ? context.query.offset : 0);

  const res = await q.statistics((s) => (stats = s)).all();

  return {
    results: res,
    total: stats.totalResults,
  };
};

const friendlyId = (id) => {
  if (!id || id.indexOf === undefined || id.indexOf('/') === -1) return id;

  return id.split('/')[1];
};

const originalId = (id, collection) => {
  if (!id || id.indexOf('/') !== -1) return id;

  return `${collection}/${id}`;
};

const fullyQualifyProductId = (type, id) => {
  switch (type) {
    case PRODUCT_TYPES.Supplement:
    case PRODUCT_TYPES.Unclassified:
    case PRODUCT_TYPES.TestKit:
      return raven.Models.Product.getId(id);
    case PRODUCT_TYPES.Medication:
      return raven.Models.Medication.getId(id);
    case PRODUCT_TYPES.Pack:
      return raven.Models.Pack.getId(id);
    default:
      return id;
  }
};

const fullyQualifyId = (key, id) => {
  switch (key) {
    case 'userId':
      return raven.Models.User.getId(id);
    case 'subscriptionId':
      return raven.Models.Subscription.getId(id);
    case 'orderId':
      return raven.Models.Order.getId(id);
    default:
      return id;
  }
};

const filter = (request, queryOrData) => {
  let q = queryOrData;
  const isArray = q instanceof Array;
  const filters = request.query.filter ? (typeof request.query.filter === 'object' ? request.query.filter : JSON.parse(request.query.filter)) : {};

  Object.keys(filters).forEach((key) => {
    if (typeof filters[key] === 'object') {
      const operator = Object.keys(filters[key])[0];
      const value = typeof filters[key][operator] === 'string' ? fullyQualifyId(key, filters[key][operator]) : filters[key][operator];
      switch (operator) {
        case '$like':
        case 'equals': {
          q = isArray ? q.filter((a) => a[key] === value) : query.whereEquals(q, key, value);
          break;
        }
        case 'neq': {
          q = isArray ? q.filter((a) => a[key] !== value) : query.whereNotEquals(q, key, value);
          break;
        }
        case 'in':
        case '$in': {
          q = isArray ? q.filter((a) => value.includes(a[key])) : query.whereIn(q, key, value);
          break;
        }
        case 'notin': {
          q = isArray ? q.filter((a) => !value.includes(a[key])) : query.whereNotIn(q, key, value);
          break;
        }
        case 'between':
        case '$between': {
          const start = value.$gte ? value.$gte : value.$gt ? value.$gt : null;
          const end = value.$lte ? value.$lte : value.$lt ? value.$lt : null;

          q = isArray ? q.filter((a) => a[key] >= start && a[key] <= end) : query.whereBetween(q, key, start, end);
          break;
        }
        default:
          break;
      }
    } else {
      const id = fullyQualifyId(key, filters[key]);
      q = isArray ? q.filter((a) => (Array.isArray(a[key]) ? a[key].includes(id) : a[key] === id)) : query.whereEquals(q, key, id);
    }
  });

  return q;
};

const copy = (source, destination) => {
  Object.keys(source).forEach((key) => {
    destination[key] = source[key];
  });
  return destination;
};

const clone = (source, extraFields) => {
  const cloned = _.cloneDeep(source);

  if (extraFields) {
    Object.keys(extraFields).forEach((field) => {
      cloned[field] = extraFields[field];
    });
  }

  return cloned;
};

module.exports = {
  friendlyId,
  originalId,
  fullyQualifyId,
  fullyQualifyProductId,
  page,
  copy,
  clone,
  sleep,
  filter,
  query,
};
