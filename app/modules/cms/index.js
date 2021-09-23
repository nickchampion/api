const Boom = require('@hapi/boom');
const axios = require('axios');
const map = require('../map');
const cache = require('../cache');
const raven = require('../ravendb');
const { AUDIT_EVENTS } = require('../../constants');
const config = require('../configuration').config();
const Audit = require('../audit');
const augmenters = require('./augmenters');

const api = axios.create({
  baseURL: config.zesttee.liveApiUrl,
  timeout: 20000,
  headers: { 'x-token': config.zesttee.liveApiToken },
});

const augment = async (context, doc, component) => {
  if (doc.content && doc.content.items) {
    if (component) {
      doc.content.items = doc.content.items.filter((i) => i.componentType && i.componentType.toLowerCase() === component.toLowerCase());
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const item of doc.content.items.filter((i) => i.componentType && augmenters[i.componentType])) {
      // eslint-disable-next-line no-await-in-loop
      await augmenters[item.componentType](context, item);
    }
  }

  const normalisedPath = doc.path.substr(1).replace(/\//g, '-').toLowerCase();

  if (augmenters[normalisedPath]) {
    await augmenters[normalisedPath](context, doc);
  }

  return doc;
};

const get = async (context) => {
  let component = null;
  let path = context.params.path[0] === '/' ? context.params.path : `/${context.params.path}`;

  const cacheKey = `cms:${path}:${context.locale}:${context.country.isoCode}:${context.country.supported}`;

  return cache.get(cacheKey, async () => {
    if (path.indexOf('__') !== -1) {
      const parts = path.split('__');
      [path, component] = parts;
    }

    const docs = await context.session
      .cms({
        path,
        locale: context.locale,
        status: 'published',
      })
      .whereIn('country', ['global', context.country.isoCode])
      .all();

    const doc = context.country.supported
      ? docs.find((d) => d.country === context.country.isoCode) || docs.find((d) => d.country === 'global')
      : docs.find((d) => d.country === 'global') || docs.find((d) => d.country === context.country.isoCode);

    if (!doc) throw Boom.notFound('COMMON_NOT_FOUND', ['Cms', `${path} > ${context.country.isoCode} > ${docs.map((d) => d.country).join(',')}`]);

    return augment(context, map.cms(doc), component);
  });
};

// publishes a page from staging to live, sync method below will be triggered in live
const publish = async (context) => {
  if (config.tag !== 'staging')
    throw Boom.badRequest('Cannot publish content from any environment except staging environment, please publish from staging to live');

  const doc = await context.session.getWithEviction(raven.Models.Cms.getId(context.params.id));

  if (doc) {
    const response = await api.post('api/cms/sync', {
      doc,
      path: doc.path,
      userId: context.user.id,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  }

  throw Boom.badRequest(`Failed to find cms document with id ${context.params.id}`);
};

// receives JSON from staging, need to update or create corresponding page in live
const sync = async (context) => {
  if (context.headers.request['x-token'] !== config.zesttee.liveApiToken) {
    throw Boom.unauthorized();
  }

  if (!config.production) {
    throw Boom.badRequest('Cannot publish to environment other than live');
  }

  const { doc, userId, path } = context.payload;
  let source = null;
  const docs = await context.session.cms({ path, country: doc.country }).all();

  if (docs.length > 1) throw Boom.badRequest(`Found multiple documents with path ${path} cannot update live`);

  if (docs.length === 0) {
    // add a new document if no doc with matching path exists
    source = new raven.Models.Cms(doc);
    source.id = undefined;
    source.metadata = undefined;
    source.createdAt = new Date().toISOString();
    await context.session.store(source);
  } else {
    // update existing document if we found it
    [source] = docs;

    // audit so we can keep a history of changes
    await new Audit(AUDIT_EVENTS.Cms_Sync)
      .withMessage(`CMS document sync > ${source.path} > ${source.type}`)
      .withReferenceId(source.id)
      .withData(raven.utils.clone(source))
      .store(context.session);

    raven.utils.copy(doc, source);
  }

  source.updatedBy = userId;
  source.updatedAt = new Date().toISOString();
  source.publishedAt = new Date().toISOString();

  return {
    success: true,
    cacheKey: `cms:${path}:${context.locale}:${context.country.isoCode}:${context.country.supported}`,
  };
};

module.exports = {
  get,
  augment,
  publish,
  sync,
};
