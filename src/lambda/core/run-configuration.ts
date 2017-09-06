import { Injectable } from 'injection-js';
import * as _ from 'lodash';
import * as os from 'os';

export interface Dictionary {
  [key: string]: string | undefined;
}

export interface RunConfigurationInterface extends Dictionary {
  bucket: string;
  syncDir: string;
  awsRegion: string;
}

class DefaultRunConfiguration implements RunConfigurationInterface {
  [key: string]: string | undefined;
  public bucket    = 'ecd-configs';
  public syncDir   = os.tmpdir() + '/_sync/';
  public awsRegion = process.env.AWS_DEFAULT_REGION || 'eu-west-1';
}

@Injectable()
export class RunConfiguration extends DefaultRunConfiguration {
  constructor(options: Dictionary) {
    super();
    _.chain(options)
      .pickBy(v => v)
      .mapKeys((_v, k) => _.camelCase(k))
      .tap(o => _.assign(this, o))
      .value();
  }
}
