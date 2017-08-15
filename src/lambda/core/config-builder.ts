import { KMS } from 'aws-sdk';
import * as fs from 'fs';
import { Injectable } from 'injection-js';
import * as _ from 'lodash';
import * as path from 'path';
import { ConfigModifier } from './config-modifiers';
import { File } from "./finder";
import { LibuclFactory } from './libucl';

const explode = function (str: string, separator: string, limit: number) {
  let arr = str.split(separator);
  if (limit) {
    arr.push(arr.splice(limit - 1).join(separator));
  }

  return arr;
};

@Injectable()
export class ConfigBuilder {
  private modifiers: ConfigModifier[] = [];

  constructor(private kms: KMS, private libuclFactory: LibuclFactory) {
  }

  addModifier(modifier: ConfigModifier) {
    this.modifiers.push(modifier);
  }

  /**
   * @param {File[]} files
   * @param {object} context
   * @return {*}
   */
  build(files: File[], context) {
    const parser = this.libuclFactory.create();

    return this.assemble(parser, files, context)
      .then((config) => this.decryptSecureValues(config))
      .then((config) => this.modify(config));
  }

  private modify(config) {
    return this.modifiers.reduce(
      (p, m) => p.then((c) => m.modify(c)),
      Promise.resolve(config)
    );
  }

  /**
   * @param {LibuclParser} parser
   * @param {File[]} files
   * @param {object} context
   * @return {*}
   * @private
   */
  private assemble(parser, files, context) {
    try {
      // register context vars
      parser.addVariable('CLUSTER', context.cluster);
      parser.addVariable('SERVICE', context.service);
      parser.addVariable('AWS_REGION', process.env.AWS_REGION);

      this.addMultipleVars(parser, context.varContent);

      if (context.vars) {
        context.vars.forEach((v) => {
          this.addMultipleVars(parser, v);
        });
      }

      files.forEach((f) => {
        switch (f.type) {
          case 'variable':
            this.addVariable(parser, f.path);
            break;
          case 'config':
            this.addConfig(parser, f.path);
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
        throw new Error(`Can not find key ${context.service} in configuration.`);
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
  private addConfig(parser, file) {
    const content = fs.readFileSync(file, { encoding: 'utf8' }).trim();

    if (content || '' !== content) {
      parser.addString(content);
    }
  }

  /**
   * @param {LibuclParser} parser
   * @param {string} file
   * @private
   */
  private addVariable(parser, file) {
    switch (path.extname(file)) {
      case '.var':
        parser.addVariable(path.basename(file, '.var'),
          fs.readFileSync(file, { encoding: 'utf8' }).trim());
        break;
      case '.properties':
        const content = fs.readFileSync(file, { encoding: 'utf8' });
        this.addMultipleVars(parser, content);
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
  private addMultipleVars(parser, string) {
    _.chain(string).split('\n')
      .map((l) => l.trim())
      .filter((l) => '' !== l)
      .map((x) => explode(x, '=', 2)).fromPairs()
      .each((v, k) => parser.addVariable(k.trim(), v.trim())).value();
  }

  /**
   * @param {*} obj
   * @return {string}
   * @private
   */
  private getSecureValue(obj) {
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
  private decryptSecureValues(config) {
    // TODO put into config modifier
    switch (true) {
      case _.isArray(config):
        return Promise.all(config.map((x) => this.decryptSecureValues(x)));
      case _.isPlainObject(config):
        let securedValue;

        if (securedValue = this.getSecureValue(config)) {
          const params = { CiphertextBlob: new Buffer(securedValue, 'base64') };

          return this.kms.decrypt(params).promise().then((k: KMS.DecryptResponse) => {
            return k.Plaintext.toString();
          });
        } else {
          const keys   = _.keys(config);
          const values = _.values(config);

          return Promise.all(values.map((x) => this.decryptSecureValues(x))).then((values) => {
            return _.zipObject(keys, values);
          });
        }
      default:
        return Promise.resolve(config);
    }
  }
}