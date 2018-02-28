'use strict';

const AWS = require('aws-sdk');
require('extend-aws-error')({ AWS });
const S3rver = require('s3rver');
const S3BlockReadStream = require('../lib/readstream');
const MemoryWriteStream = require('./memory_write_stream');
const chai = require('chai');
const expect = chai.expect;

describe('S3BlockReadStream', () => {
  let s3rverInstance;

  before(done => {
    s3rverInstance = new S3rver({
      port: 4572,
      hostname: 'localhost',
      silent: true,
      directory: __dirname + '/s3rver'
    }).run((err, host, port) => {
      if (err) return done(err);
      else done();
    });
  });

  after(done => {
    s3rverInstance.close(done);
  });

  const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy',
      s3ForcePathStyle: true,
      endpoint: new AWS.Endpoint('http://localhost:4572')
    });

  context('partial request once', () => {
    it('reads whole data', (done) => {
      const readStream = new S3BlockReadStream(s3, {
        Bucket: 'test-bucket',
        Key: 'foo/bar.txt'
      });
      const writeStream = new MemoryWriteStream();

      readStream.on('end', () => {
        expect(writeStream.toString()).to.equal('0123456789ABCDEFabcdef');
        done();
      });

      readStream.pipe(writeStream);
    });
  });

  context('partial request twice', () => {
    it('reads whole data', (done) => {
      const readStream = new S3BlockReadStream(s3, {
        Bucket: 'test-bucket',
        Key: 'foo/bar.txt'
      }, {
        blockSize: 16
      });
      const writeStream = new MemoryWriteStream();

      readStream.on('end', () => {
        expect(writeStream.toString()).to.equal('0123456789ABCDEFabcdef');
        done();
      });

      readStream.pipe(writeStream);
    });
  });

  context('target object is empty', () => {
    it('reads empty', (done) => {
      const readStream = new S3BlockReadStream(s3, {
        Bucket: 'test-bucket',
        Key: 'empty'
      }, {
        blockSize: 16
      });
      const writeStream = new MemoryWriteStream();

      readStream.on('end', () => {
        expect(writeStream.toString()).to.empty;
        done();
      });

      readStream.pipe(writeStream);
    });
  });

  context('target object does not exist', () => {
    it('throws an error', (done) => {
      const readStream = new S3BlockReadStream(s3, {
        Bucket: 'test-bucket',
        Key: 'notfound'
      }, {
        blockSize: 16
      });
      const writeStream = new MemoryWriteStream();

      readStream.on('error', (err) => {
        expect(err.code).to.eq('NotFound');
        done();
      });

      readStream.pipe(writeStream);
    });
  });
});
