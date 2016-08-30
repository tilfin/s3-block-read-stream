S3BlockReadStream
=================

[![NPM Version][npm-image]][npm-url]
[![Build Status](https://travis-ci.org/tilfin/s3-block-read-stream.svg?branch=master)](https://travis-ci.org/tilfin/s3-block-read-stream)

A S3 readable stream is downloading an object divided into blocks by partial download with the range header.

* It is possible to prevent a broken connection of long-time against S3 normal stream.
* You can adjust a download speed on flowing mode by editing the interval.
* Node.js 4.3 or Later

## How to Install

```
$ npm install s3-block-read-stream
```

## How to Use

```
const S3BlockReadStream = require('s3-block-read-stream');

new S3BlockReadStream({
  Bucket: 'test-bucket',
  Key: 'something.txt'
}, {
  interval: 1000, // interval for each http request (default is 0 millsecond)
  blockSize: 16 * 1024 * 1024 // download partial content block size at once (default is 16MB)
})
.pipe(process.stdout);
```

### Output progress information

Pass `logCallback` parameter to the second argument for constructor

```
new S3BlockReadStream({
  Bucket: 'test-bucket',
  Key: 'foo/bar.txt'
}, {
  logCallback: function(msg) {
    console.log(msg)
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
const csv = require('csv');
const S3BlockReadStream = require('s3-block-read-stream');

const readStream = new S3BlockReadStream({
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
