import gs = require('glob-stream');
import { Injectable } from 'injection-js';
import * as _ from 'lodash';
import { S3Sync } from './s3-sync';

export class File {
  /**
   * @param {string} type
   * @param {string} path
   */
  constructor(public type: string, public path: string) {
  }
}

@Injectable()
export class FileFinder {
  constructor(private s3Sync: S3Sync) {
  }

  /**
   * @param {string} cluster
   * @param {string} service
   * @return {Promise.<File[]>}
   */
  find(cluster: string, service: string) {
    return this.s3Sync.sync()
      .then((path) => {
        return Promise.all(
          [
            this.findVariableFiles(path, cluster, service),
            this.findConfigFiles(path, cluster, service)
          ]
        ).then((files) => _.flatten(files));
      });
  }

  private findVariableFiles(path: string, cluster: string, service: string): Promise<File[]> {
    return this.findFiles(path, 'variable', [
      'globals/var/*.*',
      `clusters/${cluster}/var/*`,
      `services/${service}/var/*`, `services/${service}/clusters/${cluster}/var/*`
    ]);
  }

  private findConfigFiles(path: string, cluster: string, service: string): Promise<File[]> {
    return this.findFiles(path, 'config', [
      'globals/*.conf',
      `clusters/${cluster}/*.conf`,
      `services/${service}/*.conf`, `services/${service}/clusters/${cluster}/*.conf`
    ]);
  }

  private findFiles(path: string, type: string, globs: string[]): Promise<File[]> {
    return new Promise(function (resolve, reject) {
      const files = [];

      gs(globs, { cwd: path })
        .on('data', (e) => files.push(new File(type, e.path)))
        .on('error', (err) => reject(err))
        .on('end', () => resolve(files));
    });
  }
}
