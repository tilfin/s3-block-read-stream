'use strict';

const stream = require('stream');
const util = require('util');

function MemoryWriteStream() {
  stream.Writable.call(this);
  this._encoding = null;
  this._buffer = new Buffer(0);
}
util.inherits(MemoryWriteStream, stream.Writable); // step 1
MemoryWriteStream.prototype._write = function(chunk, encoding, done) {
  if (chunk instanceof Buffer) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
  } else {
    this._encoding = encoding;
    this._buffer.write(chunk, 0, chunk.length, encoding);
  }
  done();
}
MemoryWriteStream.prototype.toString = function() {
  return this._buffer.toString(this._encoding);
}

module.exports = MemoryWriteStream;
