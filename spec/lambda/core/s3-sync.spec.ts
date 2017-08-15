import * as fs from 'fs-extra';
import * as os from 'os'
import { S3Sync } from '../../../src/lambda/core/s3-sync';

const fixtureDir = os.tmpdir() + '/__fixtures-repo';

describe('S3 synchronisation', () => {
  let s3;
  let s3Sync;
  let s3Promise = Promise.resolve({
    Body: fs.readFileSync(__dirname + '/empty.zip', { encoding: 'utf8' }),
    ETag: null
  });

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
    s3Sync.sync()
      .then(() => {
        expect(s3.getObject)
          .toHaveBeenCalledWith(jasmine.objectContaining({ Bucket: 'crazy-bucket-name' }));
      })
      .then(done)
      .catch(done.fail);
  });

  it('ignores 304 errors', (done) => {
    s3Promise = Promise.reject({ statusCode: 304 });

    s3Sync.sync().then(done, done.fail);
  });

  it('forwards non-304 errors', (done) => {
    s3Promise = Promise.reject({});

    s3Sync.sync().then(done.fail, done);
  });
});
