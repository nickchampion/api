const Hashids = require('hashids/cjs');
const crypto = require('crypto');
const Boom = require('@hapi/boom');
const slug = require('slug');
const config = require('../modules/configuration').config();

const hashids = new Hashids(config.security.hashIdsKey, 10);
const set = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const { FILE_EXTENSIONS } = require('../constants');

const hash = (password) => {
  const salt = crypto.randomBytes(16).toString('hex').replace('$', '');
  const hashed = crypto.pbkdf2Sync(
    password,
    salt,
    config.security.passwords.iterations,
    config.security.passwords.length,
    config.security.passwords.algorithm,
  );
  return `${hashed.toString('hex')}$${salt}$${config.security.passwords.iterations}$${config.security.passwords.algorithm}`;
};

const compare = (clearPassword, storedPassword) => {
  const parts = storedPassword.split('$');
  const algorithm = parts[parts.length - 1];
  const iterations = parseInt(parts[parts.length - 2]);
  const salt = parts[parts.length - 3];
  const originalPassword = storedPassword.split(`$${salt}`)[0];

  const hashedPassword = crypto.pbkdf2Sync(clearPassword, salt, iterations, config.security.passwords.length, algorithm);

  return hashedPassword.toString('hex') === originalPassword;
};

const encode = (input) => {
  return hashids.encode(input);
};

const decode = (input) => {
  return hashids.decode(input);
};

const encodeId = (code) => {
  if (!code) return code;

  const id = code.indexOf('/') === -1 ? code : code.split('/')[1];
  const parts = id.split('-');
  return `${hashids.encode(parts[0])}-${parts[1]}`;
};

const decodeId = (code, prefix) => {
  const parts = code.split('-');
  return `${prefix || 'surveys'}/${hashids.decode(parts[0])}-${parts[1]}`;
};

/*
This generates a unique number, its not secure, in that its easy enough to determine the order ID from the result
but it will prevent people guessing order codes if all our APIs only allow access to order data via the code not the ID
The point is to have a reasonably user friendly public order number
*/
const encodeOrderId = (id) => {
  const numeric = id.replace('-', '');
  const len = numeric.length;
  const digits = 11 - (len + 1);
  const pad = Math.floor(Math.random() * parseInt(`8${'9'.repeat(digits - 1)}`) + parseInt(`1${'0'.repeat(digits - 1)}`));
  return `Z${len}${pad}${numeric}`.replace(/(.{4})/g, '$1-').slice(0, -1);
};

const decodeOrderId = (id) => {
  const clean = id.replace(/-/g, '');
  const len = parseInt(clean[1]);
  const idp = clean.substr(clean.length - len);
  return `orders/${idp.substr(0, idp.length - 1)}-${idp.substr(idp.length - 1)}`;
};

const randomAlphaNumeric = (length) => {
  const bytes = crypto.randomBytes(length);
  const chars = [];

  for (let i = 0; i < bytes.length; i += 1) {
    chars.push(set[bytes[i] % set.length]);
  }

  return chars.join('');
};

const randomFileName = (fileName, id, noRandomString) => {
  const rand = noRandomString ? '' : `_${crypto.randomBytes(6).toString('hex')}`;
  const parts = fileName.split('.');

  if (parts.length === 1)
    throw Boom.badRequest('No file extension found for the uploaded file, please ensure all uploads have a valid file extension');

  const ext = parts[parts.length - 1];

  if (!FILE_EXTENSIONS.includes(ext)) throw Boom.badRequest(`Invalid file type, please upload one of the following. ${FILE_EXTENSIONS.join(', ')}`);

  const name = `${slug(parts[0].replace(/_/g, '-'))}${rand}${id ? `_${id}` : ''}`;
  return `${name}.${ext}`.toLowerCase();
};

const randomTimeBasedNumber = () => {
  let now = Date.now().toString(); // '1492341545873'
  // pad with extra random digit
  now += now + Math.floor(Math.random() * 10);
  // format
  return [now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join('');
};

module.exports = {
  encodeId,
  decodeId,
  encodeOrderId,
  decodeOrderId,
  hash,
  compare,
  randomFileName,
  randomAlphaNumeric,
  randomTimeBasedNumber,
  encode,
  decode,
};
