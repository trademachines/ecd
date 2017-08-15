import * as _ from 'lodash';
import { ConfigModifier } from './types';

export class EnvironmentFromHashConfigModifier implements ConfigModifier {
  /**
   * @param {*} config
   * @return {Promise}
   */
  modify(config: any): Promise<any> {
    if (_.has(config, 'containerDefinitions') && _.isArray(config.containerDefinitions)) {
      config.containerDefinitions = _.map(config.containerDefinitions, (v) => {
        if (_.isPlainObject(v.environment)) {
          v.environment = _.map(v.environment, (envValue, envKey) => {
            return { name: envKey, value: envValue };
          });
        }

        return v;
      });
    }

    return Promise.resolve(config);
  }
}
