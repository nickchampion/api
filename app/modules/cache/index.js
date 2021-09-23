const NodeCache = require('node-cache');
const config = require('../configuration').config();
const systemEvents = require('../../systemEvents');

const cache = new NodeCache({ stdTTL: config.cache.timeouts.oneHour, checkperiod: 120, useClones: true, deleteOnExpire: true });
const prefix = `zte:${config.tag}:`;

const set = (key, data, ttl) => cache.set(key, data, ttl || config.cache.timeouts.oneHour);

const get = async (key, getter, ttl) => {
  // get from in memory cache
  let value = cache.get(`${prefix}${key}`);

  if (value) return value;
  if (!getter) return null;

  // if we miss call the getter to retreive the data
  value = await getter();

  if (value) {
    set(`${prefix}${key}`, value, ttl);
    return value;
  }

  return null;
};

const del = (key, local) => {
  cache.del(`${prefix}${key}`);

  // raise event which will publish a message to cache manager topic so other servers also clear this key
  if (!local) systemEvents.raise(systemEvents.EVENTS.CacheChanged, { key });
};

const deleteByPrefix = (keyPrefix, local) => {
  cache
    .keys()
    .filter((k) => k.startsWith(keyPrefix))
    .forEach((k) => {
      cache.del(`${prefix}${k}`);
    });

  // raise event which will publish a message to cache manager topic so other servers also clear by this prefix
  if (!local) systemEvents.raise(systemEvents.EVENTS.CacheChanged, { prefix: keyPrefix });
};

const flush = (local) => {
  cache.flushAll();

  // raise event which will publish a message to cache manager topic so other servers also clear their cache
  if (!local) systemEvents.raise(systemEvents.EVENTS.CacheChanged, { flush: true });
};

const entries = () =>
  cache.keys().map((k) => ({
    key: k,
    value: cache.get(k),
  }));

const handleCacheEvent = (msg) => {
  if (msg.key) del(msg.key, true);
  if (msg.prefix) deleteByPrefix(msg.prefix, true);
  if (msg.flush) flush(true);
};

systemEvents.listen(systemEvents.EVENTS.CacheMessageReceived, handleCacheEvent);

module.exports = {
  get,
  set,
  del,
  deleteByPrefix,
  flush,
  keys: () => cache.keys,
  entries,
};
