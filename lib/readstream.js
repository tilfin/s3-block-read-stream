'use strict';

const Readable = require('stream').Readable;
const util = require('util');

function S3ReadStream(s3, params, options) {
  if (!(this instanceof S3ReadStream))
    return new S3ReadStream(s3, params, options);

  const opts = options || {};
  this._s3 = s3;
  this._params = params;
  this._readSize = 0;
  this._fileSize = -1;
  this._path = params.Bucket + '/' + params.Key;

  this._interval = opts.interval || 0; // msec
  delete opts.interval;
  this._blockSize = opts.blockSize || 64 * 1048576; //MB
  delete opts.blockSize;
  this._log = opts.logCallback || (opts.debug ? function(msg) { console.warn(msg) } : function(){});
  delete opts.logCallback;

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
    this._log(`${this._path} - Start`);
    this._fetchSize();
  }
}
S3ReadStream.prototype._fetchSize = function() {
  const params = {};
  for (var key in this._params) {
    if (!key.match(/^Response/)) {
      params[key] = this._params[key];
    }
  }

  this._s3.headObject(params, (err, data) => {
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }

      const reslen = parseInt(data.ContentLength, 10);
      this._log(`${this._path} - File Size: ${reslen}`);

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

  this._log(`${this._path} - Download Range: ${range}`);

  this._s3.getObject(params, (err, data) => {
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }

      const reslen = parseInt(data.ContentLength, 10);
      this._log(`${this._path} - Received Size: ${reslen}`);

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
  this._log(`${this._path} - Done`);
}

module.exports = S3ReadStream;
