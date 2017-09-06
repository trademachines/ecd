import { S3 } from 'aws-sdk';
import { emptyDir } from 'fs-extra';
import { Injectable } from 'injection-js';
import { PassThrough } from 'stream';
import * as unzip from 'unzip';
import { RunConfiguration } from './run-configuration';

const filename = 'ecd.zip';

@Injectable()
export class S3Sync {
  private etag: S3.ETag;

  constructor(private s3: S3,
              private config: RunConfiguration) {
  }

  sync(): Promise<string> {
    const retrieve = this.s3.getObject({
      Bucket: this.config.bucket,
      Key: filename,
      IfNoneMatch: this.etag
    }).promise();

    const handleS3Error = (err) => {
      if (304 !== err.statusCode) {
        return Promise.reject(err);
      }
    };

    return retrieve
      .then(this.getAndExtract.bind(this), handleS3Error)
      .then(() => this.config.syncDir);
  }

  /**
   * @param {*} obj
   * @return {Promise}
   * @private
   */
  private getAndExtract(obj) {
    const extract = () => {
      return new Promise((resolve, reject) => {
        const pass    = new PassThrough();
        const extract = new unzip.Extract({ path: this.config.syncDir });
        extract.on('close', resolve);
        extract.on('error', reject);

        pass.pipe(extract).end(obj.Body);
      });
    };

    return emptyDir(this.config.syncDir)
      .then(extract)
      .then(() => this.etag = obj.ETag);
  }
}
