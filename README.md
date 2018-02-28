S3BlockReadStream
=================

[![NPM Version][npm-image]][npm-url]
[![Build Status](https://travis-ci.org/tilfin/s3-block-read-stream.svg?branch=master)](https://travis-ci.org/tilfin/s3-block-read-stream)
[![codecov](https://codecov.io/gh/tilfin/s3-block-read-stream/branch/master/graph/badge.svg)](https://codecov.io/gh/tilfin/s3-block-read-stream)

A S3 readable stream is downloading an object divided into blocks by partial download with the range header.

* It is possible to prevent a broken connection of long-time against S3 normal stream.
* You can adjust a download speed on flowing mode by editing the interval.
* Node.js 6.10 or Later

## How to Install

```
$ npm install s3-block-read-stream
```

## How to Use

```
const AWS = require('aws-sdk');
const S3BlockReadStream = require('s3-block-read-stream');

new S3BlockReadStream(new AWS.S3({ apiVersion: '2006-03-01' }), {
  Bucket: 'test-bucket',
  Key: 'something.txt',
  // any other params of AWS.S3.getObject method
}, {
  interval: 1000, // interval for each http request (default is 0 millsecond)
  blockSize: 64 * 1024 * 1024 // download partial content block size at once (default is 64MB)
})
.pipe(process.stdout);
```

* Attention to increasing API requests if `blockSize` is too small

### Output progress information

Pass `logCallback` parameter to the second argument for constructor

```
new S3BlockReadStream(new AWS.S3({ apiVersion: '2006-03-01' }), {
  Bucket: 'test-bucket',
  Key: 'foo/bar.txt'
}, {
  logCallback: function(msg) {
    console.warn(msg)
  }
})
.pipe(process.stdout);
```

```
$ node example.js > /dev/null
test-bucket/foo/bar.txt - Start
test-bucket/foo/bar.txt - File Size: 1654534
test-bucket/foo/bar.txt - Download Range: bytes=0-1654533
test-bucket/foo/bar.txt - Received Size: 1654534
test-bucket/foo/bar.txt - Done
```

### Example

Downloading CSV file, converting into JSON and printing stdout

```
const AWS = require('aws-sdk');
const csv = require('csv');
const S3BlockReadStream = require('s3-block-read-stream');

const readStream = new S3BlockReadStream(new AWS.S3({ apiVersion: '2006-03-01' }), {
  Bucket: 'your-bucket',
  Key: 'something.csv'
});

readStream.pipe(csv.parse())
  .pipe(csv.transform(function(record){
     return JSON.stringify(record, null, 2) + '\n';
  }))
  .pipe(process.stdout);
```

## License

  [MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/s3-block-read-stream.svg
[npm-url]: https://npmjs.org/package/s3-block-read-stream
