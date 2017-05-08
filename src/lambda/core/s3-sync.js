const fs          = require('fs-promise');
const unzip       = require('unzip');
const PassThrough = require('stream').PassThrough;

const filename = 'ecd.zip';

module.exports.S3Sync = class {
  /**
   * @param {AWS.S3} s3
   * @param {string} bucket
   * @param {string} path
   */
  constructor(s3, bucket, path) {
    this.s3     = s3;
    this.bucket = bucket;
    this.path   = path;
  }

  /**
   * @return {Promise}
   */
  sync() {
    const retrieve = this.s3.getObject({
      Bucket: this.bucket,
      Key: filename,
      IfNoneMatch: this.etag
    }).promise();

    const handleS3Error = (err) => {
      if (304 !== err.statusCode) {
        return Promise.reject(err);
      }
    };

    return retrieve
      .then(this._getAndExtract.bind(this), handleS3Error)
      .then(() => this.path);
  }

  /**
   * @param {*} obj
   * @return {Promise}
   * @private
   */
  _getAndExtract(obj) {
    const extract = () => {
      return new Promise((resolve, reject) => {
        const pass    = new PassThrough();
        const extract = new unzip.Extract({path: this.path});
        extract.on('close', resolve);
        extract.on('error', reject);

        pass.pipe(extract).end(obj.Body);
      });
    };

    return fs.emptyDir(this.path)
      .then(extract)
      .then(() => this.etag = obj.ETag);
  }
};
