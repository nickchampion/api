const I18n = require('i18n');
const Boom = require('@hapi/boom');
const Hoek = require('@hapi/hoek');
const acceptLanguageParser = require('accept-language-parser');
const _ = require('lodash');

exports.extractDefaultLocale = (allLocales) => {
  if (!allLocales) {
    throw new Error('No locales defined!');
  }
  if (allLocales.length === 0) {
    throw new Error('Locales array is empty!');
  }
  return allLocales[0];
};

function detectLocaleFromAcceptedLanguages(acceptedLanguages, localesSupported) {
  const acceptedLanguageCodes = acceptLanguageParser.parse(acceptedLanguages);
  const matchedLanguageFound = acceptedLanguageCodes.find((languageCode) => {
    return localesSupported.includes(languageCode.code);
  });
  if (matchedLanguageFound) {
    if (matchedLanguageFound.region && localesSupported.includes(`${matchedLanguageFound.code}-${matchedLanguageFound.region}`)) {
      return `${matchedLanguageFound.code}-${matchedLanguageFound.region}`;
    }
    return matchedLanguageFound.code;
  }
  return null;
}

exports.plugin = {
  name: 'I18n',
  version: '1.0',
  register(server, options) {
    let pluginOptions = {};
    if (options) {
      pluginOptions = options;
    }
    I18n.configure(pluginOptions);

    const defaultLocale = pluginOptions.defaultLocale || exports.extractDefaultLocale(pluginOptions.locales);

    if (!pluginOptions.locales) {
      throw Error('No locales defined!');
    }

    server.ext('onPreAuth', (request, h) => {
      request.i18n = {};
      I18n.init(request, request.i18n);
      request.i18n.setLocale(defaultLocale);
      if (request.params && request.params.languageCode) {
        if (_.includes(pluginOptions.locales, request.params.languageCode) === false) {
          throw Boom.notFound('INTERNATIONALIZATION_NO_LOCALE', [request.params.languageCode]);
        }
        request.i18n.setLocale(request.params.languageCode);
      } else if (pluginOptions.queryParameter && request.query && request.query[pluginOptions.queryParameter]) {
        if (_.includes(pluginOptions.locales, request.query[pluginOptions.queryParameter]) === false) {
          throw Boom.notFound('INTERNATIONALIZATION_NO_LOCALE', [request.params.languageCode]);
        }
        request.i18n.setLocale(request.query[pluginOptions.queryParameter]);
      } else if (pluginOptions.languageHeaderField && request.headers[pluginOptions.languageHeaderField]) {
        const matchedLanguageCode = detectLocaleFromAcceptedLanguages(request.headers[pluginOptions.languageHeaderField], pluginOptions.locales);
        if (matchedLanguageCode) {
          request.i18n.setLocale(matchedLanguageCode);
        }
      }
      return h.continue;
    });

    server.ext('onPreResponse', (request, h) => {
      if (!request.i18n || !request.response) {
        return h.continue;
      }
      const { response } = request;

      if (response.variety === 'view') {
        response.source.context = Hoek.merge(response.source.context || {}, request.i18n);
        response.source.context.languageCode = request.i18n.getLocale();
      }
      return h.continue;
    });
  },
};
