const crypto = require('crypto');

const keys = {
  salt: 'somethingrandom',
  nonce: 10,
  iv: 16,
};

function encrypt(text, key, salt) {
  const cryptoKey = getKey(key, salt);
  const nonce = crypto.randomBytes(keys.nonce);
  const iv = Buffer.alloc(keys.iv);
  nonce.copy(iv);

  const cipher = crypto.createCipheriv('aes-256-ctr', cryptoKey, iv);
  const encrypted = cipher.update(text.toString());
  const message = Buffer.concat([nonce, encrypted, cipher.final()]);
  return message.toString('base64');
}

function decrypt(text, key, salt) {
  try {
    const cryptoKey = getKey(key, salt);
    const message = Buffer.from(text, 'base64');
    const iv = Buffer.alloc(keys.iv);
    message.copy(iv, 0, 0, keys.nonce);
    const encryptedText = message.slice(keys.nonce);
    const decipher = crypto.createDecipheriv('aes-256-ctr', cryptoKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return null;
  }
}

function getKey(key, salt) {
  return crypto.pbkdf2Sync(key, salt || keys.salt, 10000, 32, 'sha512');
}

function getCartToken() {
  return crypto.randomBytes(18).toString('hex');
}

module.exports = { decrypt, encrypt, getCartToken };
