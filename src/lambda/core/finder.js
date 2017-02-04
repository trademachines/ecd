'use strict';

const _  = require('lodash');
const gs = require('glob-stream');

/**
 */
class File {
  /**
   * @param {string} type
   * @param {string} path
   */
  constructor(type, path) {
    this.type = type;
    this.path = path;
  }
}

/**
 */
class FileFinder {
  /**
   * @param {S3Sync} s3Sync
   */
  constructor(s3Sync) {
    this.s3Sync = s3Sync;
  }

  /**
   * @param {string} environment
   * @param {string} service
   * @return {Promise.<File[]>}
   */
  find(environment, service) {
    return this.s3Sync.sync()
      .then((path) => {
        return Promise.all(
          [
            this._findVariableFiles(path, environment, service),
            this._findConfigFiles(path, environment, service)
          ]
        ).then((files) => _.flatten(files));
      });
  }

  /**
   * @param {string} path
   * @param {string} environment
   * @param {string} service
   * @return {Promise.<File[]>}
   * @private
   */
  _findVariableFiles(path, environment, service) {
    return this._findFiles(path, 'variable', [
      'globals/var/*',
      `environments/${environment}/var/*`,
      `services/${service}/var/*`, `services/${service}/environments/${environment}/var/*`
    ]);
  }

  /**
   * @param {string} path
   * @param {string} environment
   * @param {string} service
   * @return {Promise.<File[]>}
   * @private
   */
  _findConfigFiles(path, environment, service) {
    return this._findFiles(path, 'config', [
      'globals/*.conf',
      `environments/${environment}/*.conf`,
      `services/${service}/*.conf`, `services/${service}/environments/${environment}/*.conf`
    ]);
  }

  /**
   * @param {string} path
   * @param {string} type
   * @param {Array} globs
   * @return {Promise.<File[]>}
   * @private
   */
  _findFiles(path, type, globs) {
    return new Promise(function(resolve, reject) {
      const files = [];

      gs.create(globs, {cwd: path})
        .on('data', (e) => files.push(new File(type, e.path)))
        .on('error', (err) => reject(err))
        .on('end', () => resolve(files));
    });
  }
}

module.exports.File       = File;
module.exports.FileFinder = FileFinder;
