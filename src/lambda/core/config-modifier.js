'use strict';

const _ = require('lodash');

/**
 */
class EnvironmentFromHashConfigModifier {
  /**
   * @param {*} config
   * @return {Promise}
   */
  modify(config) {
    if (_.has(config, 'containerDefinitions') && _.isArray(config.containerDefinitions)) {
      config.containerDefinitions = _.mapValues(config.containerDefinitions, (v) => {
        if (_.isPlainObject(v.environment)) {
          v.environment = _.map(v.environment, (envValue, envKey) => {
            return {name: envKey, value: envValue};
          });
        }

        return v;
      });
    }

    return Promise.resolve(config);
  }
}

module.exports.EnvironmentFromHashConfigModifier = EnvironmentFromHashConfigModifier;
