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
      config.containerDefinitions = _.map(config.containerDefinitions, (v) => {
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

/**
 */
class PortMappingFromStringConfigModifier {
  /**
   * @param {*} config
   * @return {Promise}
   */
  modify(config) {
    if (_.has(config, 'containerDefinitions') && _.isArray(config.containerDefinitions)) {
      config.containerDefinitions = _.map(config.containerDefinitions, (v) => {
        if (_.isArray(v.portMappings)) {
          v.portMappings = _.map(v.portMappings, (p) => {
            if (_.isString(p) || _.isNumber(p)) {
              let [hostPort, containerPort] = String(p).split(':');

              if (!containerPort) {
                containerPort = hostPort;
                hostPort      = 0;
              }

              hostPort = parseInt(hostPort, 10);
              containerPort = parseInt(containerPort, 10);

              return {hostPort: hostPort, containerPort: containerPort};
            } else {
              return p;
            }
          });
        }

        return v;
      });
    }

    return Promise.resolve(config);
  }
}

module.exports.EnvironmentFromHashConfigModifier   = EnvironmentFromHashConfigModifier;
module.exports.PortMappingFromStringConfigModifier = PortMappingFromStringConfigModifier;
