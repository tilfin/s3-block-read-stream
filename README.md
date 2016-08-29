S3BlockReadStream
=================

A S3 readable stream is downloading an object divided into blocks by partial download with the range header.

* It is possible to prevent a broken connection of long-time against S3 normal stream.
* You can adjust a download speed on flowing mode by editing the interval.

## How to Install

```
$ npm install s3-block-read-stream
```

## How to Use

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
