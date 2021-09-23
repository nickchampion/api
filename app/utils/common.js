/* eslint-disable no-return-assign */
/* eslint-disable global-require */
const slug = require('slug');
const errordite = require('../modules/errordite');
const { PRODUCT_TYPES } = require('../constants');

const toRawType = (value) => {
  const ts = Object.prototype.toString;
  const str = ts.call(value);
  return str.slice(8, -1);
};

const isPromise = (obj) => {
  return toRawType(obj) === 'Promise';
};

const format = (input, args) => {
  let result = input;

  if (Array.isArray(args)) {
    for (let i = 0; i < args.length; i += 1) {
      result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i]);
    }
  } else {
    result = result.replace(new RegExp(`\\{${0}\\}`, 'g'), args);
  }

  return result;
};

const handleError = (e, logError, rethrow, context) => {
  if (logError) {
    if (context && context.name) {
      e.name = context.name;
      delete context.name;
    }
    e.context = context || {};
    errordite.log(e);
  }

  if (rethrow) throw e;

  return {
    failed: true,
    error: errordite.extractMessageFromError(e),
  };
};

const tryGet = (action, defaultValue) => {
  try {
    return action();
  } catch {
    return defaultValue;
  }
};

const tryExecuteAsync = async (action, logError, rethrow, context) => {
  try {
    return await action();
  } catch (e) {
    return handleError(e, logError, rethrow, context);
  }
};

const tryExecute = (action, logError, rethrow, context) => {
  try {
    return action();
  } catch (e) {
    return handleError(e, logError, rethrow, context);
  }
};

const applyRecursion = (obj, setter, getter) => {
  if (!obj) return;

  if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      applyRecursion(obj[key], (e) => (obj[key] = e), getter);
    });
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) {
      applyRecursion(obj[i], (e) => (obj[i] = e), getter);
    }
  } else {
    const newValue = getter(obj);

    if (newValue) setter(newValue);
  }
};

const apply = (obj, getter) => {
  if (!obj) return;

  Object.keys(obj).forEach((key) => {
    applyRecursion(obj[key], (e) => (obj[key] = e), getter);
  });
};

const slugPath = (pth) => {
  if (!pth) return null;

  const pathSlug = pth[0] === '/' ? pth.substr(1) : pth;
  let result = '';
  pathSlug.split('/').forEach((p) => {
    result += `/${slug(p)}`;
  });
  return result.toLowerCase();
};

const copy = (source, destination) => {
  Object.keys(source).forEach((key) => {
    destination[key] = source[key];
  });
};

const partition = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);

const commonArrayElements = (arr1, arr2) => {
  const set = new Set(arr2);
  return arr1.some((el) => set.has(el));
};

const firstOrNull = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr[0];
};

// Gets the id of the product from cart or order based on type
const getItemId = (item) => {
  return item.type === PRODUCT_TYPES.Medication
    ? item.medicationId
    : item.type === PRODUCT_TYPES.CustomPack || item.type === PRODUCT_TYPES.Pack
    ? item.packId
    : item.productId;
};

module.exports = {
  extractMessageFromError: errordite.extractMessageFromError,
  tryGet,
  tryExecuteAsync,
  tryExecute,
  slugPath,
  copy,
  partition,
  apply,
  toRawType,
  commonArrayElements,
  getItemId,
  format,
  firstOrNull,
  isPromise,
};
