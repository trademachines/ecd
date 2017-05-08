const S3Sync     = require('./../../../src/lambda/core/s3-sync').S3Sync;
const os         = require('os');
const fs         = require('fs-promise');
const fixtureDir = os.tmpDir() + '/__fixtures-repo';

describe('S3 synchronisation', () => {
  let s3;
  let s3Sync;
  let s3Promise = Promise.resolve({
    Body: fs.readFileSync(__dirname + '/empty.zip', {encoding: 'utf8'}),
    ETag: null
  });
  let noop      = () => {
  };

  beforeEach(() => {
    s3     = {
      getObject: () => {
        return {
          promise: () => {
            return s3Promise;
          }
        };
      }
    };
    s3Sync = new S3Sync(s3, 'crazy-bucket-name', fixtureDir);
    spyOn(fs, 'emptyDir').and.returnValue(Promise.resolve());
  });

  afterEach((done) => {
    fs.remove(fixtureDir).then(done, done);
  });

  it('uses individual bucket name', (done) => {
    spyOn(s3, 'getObject').and.callThrough();
    s3Sync.sync().then(
      () => {
        expect(s3.getObject)
          .toHaveBeenCalledWith(jasmine.objectContaining({Bucket: 'crazy-bucket-name'}));

        done();
      },
      done.fail
    );
  });

  it('ignores 304 errors', (done) => {
    s3Promise = Promise.reject({statusCode: 304});

    s3Sync.sync().then(done, done.fail);
  });

  it('forwards non-304 errors', (done) => {
    s3Promise = Promise.reject({});

    s3Sync.sync().then(done.fail, done);
  });
});
