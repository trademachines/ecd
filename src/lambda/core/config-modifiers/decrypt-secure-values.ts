import { KMS } from 'aws-sdk';
import { Injectable } from 'injection-js';
import * as _ from 'lodash';
import { ConfigModifier } from './types';

@Injectable()
export class DecryptSecureValuesConfigModifier implements ConfigModifier {
  constructor(private kms: KMS) {
  }

  modify(config: any): Promise<any> {
    switch (true) {
      case _.isArray(config):
        return Promise.all(config.map(x => this.modify(x)));
      case _.isPlainObject(config):
        let securedValue;

        if (securedValue = this.getSecureValue(config)) {
          const params = { CiphertextBlob: new Buffer(securedValue, 'base64') };

          return this.kms.decrypt(params).promise()
            .then((k: KMS.DecryptResponse) => k.Plaintext.toString());
        } else {
          const keys   = _.keys(config);
          const values = _.values(config);

          return Promise.all(values.map(x => this.modify(x)))
            .then(values => _.zipObject(keys, values));
        }
      default:
        return Promise.resolve(config);
    }
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
}
