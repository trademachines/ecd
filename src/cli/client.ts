import path = require('path');
import { Lambda } from 'aws-sdk'
import * as fs from 'fs-extra';
import * as _ from 'lodash';

export class EcdClient {
  private callCount: number = 0;
  private _region: string;
  private _functionName: string;

  constructor(private basePath: string) {
  }

  set region(value: string) {
    this._region = value;
  }

  set functionName(value: string) {
    this._functionName = value;
  }

  call(method: string, cluster: string, service: string, configFile?: string, varFiles?: string[], vars?: string[]) {
    const fileContents = [
      this.readFile(configFile),
      ...(varFiles || []).map((f) => this.readFile(f))
    ];

    const callLambda = ([configContent, ...varContents]) => {
      const lambda = this.getLambdaClient();
      const params = [
        {
          cluster: cluster,
          service: service,
          configContent: configContent,
          varContent: varContents.join(`\n`),
          vars: vars
        }
      ];

      return lambda.invoke({
        FunctionName: this._functionName,
        Payload: JSON.stringify({
          method: method,
          params: params,
          id: ++this.callCount
        })
      }).promise();
    };
    const extract    = (res) => Promise.resolve(JSON.parse(_.get(res, 'Payload')));

    return Promise.all(fileContents)
      .then(callLambda)
      .then(extract);
  }

  getLambdaClient(): Lambda {
    // TODO assert region and function name

    let config: Lambda.Types.ClientConfiguration = {} as Lambda.Types.ClientConfiguration;
    config.apiVersion                            = '2015-03-31';
    config.region                                = this._region;
    // config.params = {
    //   FunctionName: this._functionName
    // };

    return new Lambda(config);
  }

  private readFile(file: string): Promise<string> {
    if (!file) {
      return Promise.resolve(file);
    }

    return fs.readFile(path.resolve(this.basePath, file), { encoding: 'utf8' })
      .then((contents) => contents.trim());
  }
}
