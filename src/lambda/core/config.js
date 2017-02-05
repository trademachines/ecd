'use strict';

const path = require('path');
const fs   = require('fs');
const _    = require('lodash');

const explode = function(str, separator, limit) {
  let arr = str.split(separator);
  if (limit) {
    arr.push(arr.splice(limit - 1).join(separator));
  }

  return arr;
};

/**
 */
class ConfigBuilder {
  /**
   * @param {AWS.KMS} kms
   * @param {LibuclFactory} libuclFactory
   */
  constructor(kms, libuclFactory) {
    this.kms           = kms;
    this.libuclFactory = libuclFactory;
  }

  /**
   * @param {File[]} files
   * @param {object} context
   * @return {*}
   */
  build(files, context) {
    const parser = this.libuclFactory.create();

    return this._assemble(parser, files, context)
      .then((config) => Promise.resolve(config))
      .then((config) => this._decryptSecureValues(config))
      .catch((err) => Promise.reject(err))
      ;
  }

  /**
   * @param {LibuclParser} parser
   * @param {File[]} files
   * @param {object} context
   * @return {*}
   * @private
   */
  _assemble(parser, files, context) {
    try {
      // register context vars
      parser.addVariable('ENVIRONMENT', context.environment);
      parser.addVariable('CLUSTER', context.environment);
      parser.addVariable('SERVICE', context.service);

      parser.addVariable('AWS_REGION', process.env.AWS_REGION);

      this._addMultipleVars(parser, context.varContent);

      if (context.vars) {
        context.vars.forEach((v) => {
          this._addMultipleVars(parser, v);
        });
      }

      files.forEach((f) => {
        switch (f.type) {
          case 'variable':
            this._addVariable(parser, f.path);
            break;
          case 'config':
            this._addConfig(parser, f.path);
            break;
        }
      });

      // TODO check if service key already exists, then either throw an error or behave differently
      if (!!context.configContent) {
        parser.addString(context.configContent);
      }

      // TODO: catch syntax errors and make them more them obvious?
      // Syntax error in config: [Error: error while parsing <unknown>:
      // line: 15, column: 4 - 'unexpected terminating symbol detected', character: '}'] undefined

      let json = parser.asJson();

      if (!_.has(json, context.service)) {
        return Promise.reject(new Error(`Can not find key ${context.service} in configuration`));
      }

      json        = json[context.service];
      json.family = context.service;

      return Promise.resolve(json);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * @param {LibuclParser} parser
   * @param {string} file
   * @private
   */
  _addConfig(parser, file) {
    const content = fs.readFileSync(file, {encoding: 'utf8'}).trim();

    if (content || '' !== content) {
      parser.addString(content);
    }
  }

  /**
   * @param {LibuclParser} parser
   * @param {string} file
   * @private
   */
  _addVariable(parser, file) {
    switch (path.extname(file)) {
      case '.var':
        parser.addVariable(path.basename(file, '.var'),
          fs.readFileSync(file, {encoding: 'utf8'}).trim());
        break;
      case '.properties':
        const content = fs.readFileSync(file, {encoding: 'utf8'});
        this._addMultipleVars(parser, content);
        break;
      default:
        throw new Error(`Can not handle variable file ${file}`);
    }
  }

  /**
   * @param {LibuclParser} parser
   * @param {string} string
   * @private
   */
  _addMultipleVars(parser, string) {
    _.chain(string).split('\n')
      .map((l) => l.trim())
      .filter((l) => '' !== l)
      .map((x) => explode(x, '=', 2)).fromPairs()
      .each((v, k) => {
        parser.addVariable(k.trim(), v.trim());
      }).value();
  }

  /**
   * @param {*} obj
   * @return {string}
   * @private
   */
  _getSecureValue(obj) {
    const keys = Object.keys(obj);
    if (1 === keys.length && 'secure' === keys[0] && _.isString(obj.secure)) {
      return obj.secure;
    }
  }

  /**
   * @param {object} config
   * @return {Promise}
   * @private
   */
  _decryptSecureValues(config) {
    switch (true) {
      case _.isArray(config):
        return Promise.all(config.map((x) => this._decryptSecureValues(x)));

        break;
      case _.isPlainObject(config):
        let securedValue;

        if (securedValue = this._getSecureValue(config)) {
          const params = {CiphertextBlob: new Buffer(securedValue, 'base64')};

          return this.kms.decrypt(params).promise().then((k) => {
            return k.Plaintext.toString('utf8');
          });
        } else {
          const keys   = _.keys(config);
          const values = _.values(config);

          return Promise.all(values.map((x) => this._decryptSecureValues(x))).then((values) => {
            return _.zipObject(keys, values);
          });
        }
        break;

      default:
        return Promise.resolve(config);
    }
  }
}

module.exports.ConfigBuilder = ConfigBuilder;
