import { CloudWatchEvents, ECS, KMS, S3 } from 'aws-sdk';
import { Injector, ReflectiveInjector } from 'injection-js';
import { bootstrap as apiBootstrap, providers as apiProviders } from './api';
import { bootstrap as coreBootstrap, providers as coreProviders } from './core';
import { RunConfiguration } from './core/run-configuration';
import { JsonRpcServer, providers as serverProviders } from './server';
import Ajv = require('ajv');

export const providers = ReflectiveInjector.resolve([
  {
    provide: RunConfiguration,
    deps: [],
    useFactory: () => new RunConfiguration(process.env)
  },
  {
    provide: 'ajv',
    useValue: new Ajv()
  },
  S3,
  {
    provide: KMS,
    deps: [RunConfiguration],
    useFactory: (c: RunConfiguration) => new KMS({ region: c.awsRegion })
  },
  {
    provide: ECS,
    deps: [RunConfiguration],
    useFactory: (c: RunConfiguration) => new ECS({ region: c.awsRegion })
  },
  {
    provide: CloudWatchEvents,
    deps: [RunConfiguration],
    useFactory: (c: RunConfiguration) => new CloudWatchEvents({ region: c.awsRegion })
  },
  ...apiProviders(),
  ...serverProviders(),
  ...coreProviders()
]);
export const injector  = ReflectiveInjector.fromResolvedProviders(providers);
export const bootstrap = (i?: Injector) => [coreBootstrap, apiBootstrap].forEach(b => b(i || injector));
export const handler   = () => {
  const jsonRpcServer = injector.get(JsonRpcServer);
  return jsonRpcServer.handle.bind(jsonRpcServer);
};
