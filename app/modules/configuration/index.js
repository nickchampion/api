/* eslint-disable global-require */
/*
Purpose of this component is to build a configuration object based on current environment using the baseline config found 
in the configuration.json file in the root of the project
You can have your own local overrides of this config, just create a file called configurationlocal.json 
also in the root (this will be ignored by git).

The config system can handle encrypted properties and anything sensitive should be encrypted,the properties 
will be decrypted when we initialise the config system.

Your local overrides file should look like this where the property name is a path to the config value you 
want to replace and the property value is the replacement value

{
  "cache.prefix": "nick",
  "database.connection": "postgres://zesttee:admin@postgres:5432/zesttee"
}

DO NOT ENCRYPT LOCAL CONFIGURATION, THIS IS NOT SUPPORTED AND IS UNNECESSARY
*/

const _ = require('lodash');
const crypto = require('../../utils/crypto');

const keys = {
  default: 'default',
  encrypted: 'encrypted',
  encryptionKey: process.env.CONFIGURATION_KEY,
  environment: process.env.STAGE,
};

let config = null;

const tryGet = (action, defaultValue) => {
  try {
    return action();
  } catch {
    return defaultValue;
  }
};

const getEnvironmentValues = (value) => {
  const environments = {};

  Object.keys(value).forEach((prop) => {
    if (prop.indexOf('|') !== -1) {
      _.each(prop.split('|'), (env) => (environments[env] = value[prop]));
    } else {
      environments[prop] = value[prop];
    }
  });

  return environments;
};

const overrideProperty = (configuration, pathParts, index, replacement, local, path) => {
  if (typeof configuration[pathParts[index]] === 'object')
    return overrideProperty(configuration[pathParts[index]], pathParts, index + 1, replacement, local, path);

  configuration[pathParts[index]] = Object.prototype.hasOwnProperty.call(local, `${path}.encrypted`)
    ? crypto.decrypt(replacement, keys.encryptionKey)
    : replacement;

  return configuration[pathParts[index]];
};

const assignProperty = (parent, name, value) => {
  if (Array.isArray(value)) {
    parent[name] = value;
  } else if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, keys.default)) {
    const encrypted = Object.prototype.hasOwnProperty.call(value, keys.encrypted) ? value[keys.encrypted] : false;
    const environmentValues = getEnvironmentValues(value);
    const extracted = Object.prototype.hasOwnProperty.call(environmentValues, keys.environment)
      ? environmentValues[keys.environment]
      : environmentValues[keys.default];

    parent[name] = encrypted && extracted !== null && extracted !== '' ? crypto.decrypt(extracted, keys.encryptionKey) : extracted;
  } else if (typeof value === 'object') {
    // if its an object but has no key named default then we're interested in its children so recursively call assignProperty
    parent[name] = {};
    Object.keys(value).forEach((prop) => {
      assignProperty(parent[name], prop, value[prop]);
    });
  } else if (value === '.env') {
    // if the value is .env this indicates we'll read the value from the .env file
    parent[name] = process.env[name.toUpperCase()];
  } else if (value === '.keys') {
    // if the value is .keys this indicates we'll read the value keys collection above
    parent[name] = keys[name];
  } else {
    // if the property is not an object just take its value, means its the same value in all environments
    parent[name] = value;
  }
};

const build = () => {
  if (config !== null) return config;

  // read baseline config values
  const json = require('../../../configuration.json');

  // for local development look for a configurationlocal.json file for any overrides
  const local = keys.environment === 'dev' ? tryGet(() => require('../../../configurationlocal.json'), {}) : {};

  // config object we'll build and cache
  config = {};

  // extract properties and locate the correct environment value for it
  Object.keys(json).forEach((prop) => {
    assignProperty(config, prop, json[prop]);
  });

  // apply any local overrides to the config values
  Object.keys(local).forEach((path) => {
    overrideProperty(config, path.split('.'), 0, local[path], local, path);
  });

  return config;
};

module.exports.config = build;
