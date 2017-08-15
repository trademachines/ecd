import * as _ from 'lodash';
import { ConfigModifier } from './types';

export class PortMappingFromStringConfigModifier implements ConfigModifier {
  modify(config: any): Promise<any> {
    if (_.has(config, 'containerDefinitions') && _.isArray(config.containerDefinitions)) {
      config.containerDefinitions = _.map(config.containerDefinitions, (v) => {
        if (_.isArray(v.portMappings)) {
          v.portMappings = _.map(v.portMappings, (p) => {
            if (_.isString(p) || _.isNumber(p)) {
              let [hostPort, containerPort] = String(p).split(':').map(x => Number(x));

              if (!containerPort) {
                containerPort = hostPort;
                hostPort      = 0;
              }

              return { hostPort: hostPort, containerPort: containerPort };
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
