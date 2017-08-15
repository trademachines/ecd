import { Context, Handler } from 'aws-lambda';
import { InjectionToken, Injector } from 'injection-js';
import { Type } from 'injection-js/facade/type';
import { JsonRpcEvent } from '../../src/lambda/server/json-rpc';
import thenify = require('thenify');

export type PromisifiedHandler = (event: any, context: Context) => Promise<any>;

export class RequestBuilder implements Injector {
  private handler: PromisifiedHandler;
  private configContent: string;
  private varContent: string[] = [];

  constructor(handler: Handler, private injector: Injector) {
    this.handler = thenify(handler);
  }

  withConfig(config: string): RequestBuilder {
    this.configContent = config;

    return this;
  }

  withVar(key: string, value: string): RequestBuilder {
    this.varContent.push(`${key}=${value}`);

    return this;
  }

  run(command: string, cluster: string, service: string) {
    return this.handler(this.getJsonRpcEvent(command, cluster, service), null as Context);
  }

  get <T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T): T;
  get (token: any, notFoundValue?: any);
  get (token: any, notFoundValue?: any) {
    return this.injector.get(token, notFoundValue);
  }

  private getJsonRpcEvent(command: string, cluster: string, service: string): JsonRpcEvent {
    return {
      id: 1,
      method: command,
      params: [{
        cluster: cluster,
        service: service,
        configContent: this.configContent,
        varContent: this.varContent.join(`\n`),
        vars: []
      }]
    };
  }
}
