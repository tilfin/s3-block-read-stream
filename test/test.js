'use strict';

const nock = require('nock');
const S3BlockReadStream = require('../lib/readstream');
const MemoryWriteStream = require('./memory_write_stream');
const chai = require('chai');
const expect = chai.expect;


describe('S3BlockReadStream', () => {
  const headRes = {
    'accept-ranges': 'bytes',
    'content-type': 'application/octet-stream',
    'content-length': '22',
  };

  afterEach(() => {
    nock.cleanAll();
  });

  context('partial request once', () => {
    let scope;

    before(() => {
      scope = nock('https://test-bucket.s3.amazonaws.com', {
          encodedQueryParams: true
        })
        .head('/foo/bar.txt')
        .reply(200, '', headRes)
        .get('/foo/bar.txt')
        .matchHeader('Range', 'bytes=0-21')
        .reply(206, '0123456789ABCDEFabcdef', {
          'accept-ranges': 'bytes',
          'content-range': 'bytes 0-21/22',
          'content-type': 'application/octet-stream',
          'content-length': '22'
        });
    });

    it('read whole data', (done) => {
      const readStream = new S3BlockReadStream({
        Bucket: 'test-bucket',
        Key: 'foo/bar.txt'
      });
      const writeStream = new MemoryWriteStream();

      readStream.on('end', function() {
        expect(writeStream.toString()).to.equal('0123456789ABCDEFabcdef');
        expect(scope.isDone()).to.be.true;
        done();
      });

      readStream.pipe(writeStream);
    });
  });

  context('partial request twice', () => {
    let scope;

    before(() => {
      scope = nock('https://test-bucket.s3.amazonaws.com', {
          encodedQueryParams: true
        })
        .head('/foo/bar.txt')
        .reply(200, '', headRes)
        .get('/foo/bar.txt')
        .matchHeader('Range', 'bytes=0-15')
        .reply(206, '0123456789ABCDEF', {
          'accept-ranges': 'bytes',
          'content-range': 'bytes 0-15/16',
          'content-type': 'application/octet-stream',
          'content-length': '16'
        })
        .get('/foo/bar.txt')
        .matchHeader('range', 'bytes=16-21')
        .reply(206, 'abcdef', {
          'accept-ranges': 'bytes',
          'content-range': 'bytes 16-21/6',
          'content-type': 'application/octet-stream',
          'content-length': '6'
        });
    });

    it('read whole data', (done) => {
      const readStream = new S3BlockReadStream({
        Bucket: 'test-bucket',
        Key: 'foo/bar.txt'
      }, {
        blockSize: 16
      });
      const writeStream = new MemoryWriteStream();

      readStream.on('end', function() {
        expect(writeStream.toString()).to.equal('0123456789ABCDEFabcdef');
        expect(scope.isDone()).to.be.true;
        done();
      });

      readStream.pipe(writeStream);
    });
  });
});
