/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
const { Writable } = require('stream');
const util = require('util');

const WriteStream = function () {
  Writable.call(this, { objectMode: true });
  this.buffer = [];
};

util.inherits(WriteStream, Writable);

WriteStream.prototype._write = function (chunk, encoding, callback) {
  this.buffer += chunk;
  callback();
};

const wait = (stream) => {
  return util.promisify(stream.finished).bind(stream);
};

module.exports = {
  WriteStream,
  wait,
};
