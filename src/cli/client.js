'use strict';

const AWS  = require('aws-sdk');
const fs   = require('fs-promise');
const path = require('path');
const _    = require('lodash');

module.exports.ApiClient = class ApiClient {
  /**
   * @param {string} basePath
   */
  constructor(basePath) {
    this.basePath  = basePath;
    this.callCount = 0;
  }

  /**
   * @param {string} region
   * @param {string} functionName
   */
  configure(region, functionName) {
    this.region       = region;
    this.functionName = functionName;
  }

  /**
   * @param {string} method
   * @param {string} environment
   * @param {string} service
   * @param {string} configContent
   * @param {string} varContent
   * @param {string[]} vars
   * @return {Promise}
   */
  call(method, environment, service, configContent, varContent, vars) {
    const lambda     = this._getLambdaClient();
    const readFiles  = [this._readFile(configContent), this._readFile(varContent)];
    const callLambda = (contents) => {
      const params = [
        {
          environment: environment,
          service: service,
          configContent: contents[0],
          varContent: contents[1],
          vars: vars
        }
      ].concat(contents);

      return lambda.invoke({
        FunctionName: this.functionName,
        Payload: JSON.stringify({
          method: method,
          params: params,
          id: ++this.callCount
        })
      }).promise();
    };
    const extract    = (res) => Promise.resolve(JSON.parse(_.get(res, 'Payload')));

    return Promise.all(readFiles)
      .then(callLambda)
      .then(extract);
  }

  /**
   * @return {Lambda}
   * @private
   */
  _getLambdaClient() {
    const config = {};

    if (this.region) {
      config.region = this.region;
    }

    return new AWS.Lambda(config);
  }

  /**
   * @param {string} file
   * @return {Promise}
   * @private
   */
  _readFile(file) {
    if (!file) {
      return Promise.resolve(file);
    }

    return fs.readFile(path.resolve(this.basePath, file), {encoding: 'utf8'})
      .then((contents) => contents.trim());
  }
};
