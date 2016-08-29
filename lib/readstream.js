'use strict';

const AWS = require('aws-sdk');
const Readable = require('stream').Readable;
const util = require('util');

function S3ReadStream(params, options) {
  if (!(this instanceof S3ReadStream))
    return new S3ReadStream(params, options);

  const opts = options || {};
  this._s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  this._params = params;
  this._readSize = 0;
  this._fileSize = -1;
  this._interval = opts.interval || 0; // msec
  delete opts.interval;
  this._blockSize = opts.blockSize || 1024 * 1024 * 16; //MB
  delete opts.blockSize;
  Readable.call(this, opts);
}
util.inherits(S3ReadStream, Readable);
S3ReadStream.prototype._read = function() {
  if (this._readSize === this._fileSize) {
    this._done();
  } else if (this._readSize) {
    setTimeout(() => {
      this._nextDownload();
    }, this._interval);
  } else {
    this._fetchSize();
  }
}
S3ReadStream.prototype._fetchSize = function() {
  const params = Object.assign({}, this._params);

  this._s3.headObject(params, (err, data) => {
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }

      const reslen = parseInt(data.ContentLength, 10);
      console.warn('File Size: %d', reslen);

      if (reslen > 0) {
        this._fileSize = reslen;
        this._nextDownload();
      } else {
        this._done();
      }
    });
}
S3ReadStream.prototype._downloadRange = function(offset, length) {
  const params = Object.assign({}, this._params);
  const lastPos = offset + length - 1;
  const range = 'bytes=' + offset + '-' + lastPos;
  params['Range'] = range;

  console.warn('Download Range: %s', range);

  this._s3.getObject(params, (err, data) => {
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }

      const reslen = parseInt(data.ContentLength, 10);
      console.warn('Received Size: %d', reslen);

      if (reslen > 0) {
        this._readSize += reslen;
        this.push(data.Body);
      } else {
        this._done();
      }
    });
}
S3ReadStream.prototype._nextDownload = function() {
  let len = 0;
  if (this._readSize + this._blockSize < this._fileSize) {
    len = this._blockSize;
  } else {
    len = this._fileSize - this._readSize;
  }
  this._downloadRange(this._readSize, len);
}
S3ReadStream.prototype._done = function() {
  this._readSize = 0;
  this.push(null);
  console.warn('Done');
}

module.exports = S3ReadStream;
