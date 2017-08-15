import { S3 } from 'aws-sdk';
import { emptyDir } from 'fs-extra';
import { Inject, Injectable } from 'injection-js';
import { PassThrough } from 'stream';
import * as unzip from 'unzip';

const filename = 'ecd.zip';

@Injectable()
export class S3Sync {
  private etag: S3.ETag;

  constructor(private s3: S3,
              @Inject('ecd.s3.bucket') private bucket: string,
              @Inject('ecd.sync.dir') private path: string) {
  }

  sync(): Promise<string> {
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
      .then(this.getAndExtract.bind(this), handleS3Error)
      .then(() => this.path);
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
        const extract = new unzip.Extract({ path: this.path });
        extract.on('close', resolve);
        extract.on('error', reject);

        pass.pipe(extract).end(obj.Body);
      });
    };

    return emptyDir(this.path)
      .then(extract)
      .then(() => this.etag = obj.ETag);
  }
}
