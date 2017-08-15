import { CloudWatchEvents, ECS, KMS, S3 } from 'aws-sdk';
import { Injector, ReflectiveInjector } from 'injection-js';
import * as os from 'os';
import { bootstrap as apiBootstrap, providers as apiProviders } from './api';
import { bootstrap as coreBootstrap, providers as coreProviders } from './core';
import { JsonRpcServer, providers as serverProviders } from './server';
import Ajv = require('ajv');

export const providers = ReflectiveInjector.resolve([
  {
    provide: 'ecd.sync.dir',
    useValue: os.tmpdir() + '/_sync/'
  },
  {
    provide: 'ecd.s3.bucket',
    useValue: process.env.BUCKET || 'tm-ecd-configs'
  },
  {
    provide: 'aws.region',
    useValue: process.env.AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-1'
  },
  {
    provide: 'ajv',
    useValue: new Ajv()
  },
  S3,
  {
    provide: KMS,
    deps: ['aws.region'],
    useFactory: (region: string) => new KMS({ region: region })
  },
  {
    provide: ECS,
    deps: ['aws.region'],
    useFactory: (region: string) => new ECS({ region: region })
  },
  {
    provide: CloudWatchEvents,
    deps: ['aws.region'],
    useFactory: (region: string) => new CloudWatchEvents({ region: region })
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
