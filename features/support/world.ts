import { CloudWatchEvents, ECS, KMS } from 'aws-sdk';
import { defineSupportCode } from 'cucumber';
import { ReflectiveInjector } from 'injection-js';
import { S3Sync } from '../../src/lambda/core';
import { bootstrap, providers } from '../../src/lambda/injector';
import { JsonRpcServer } from '../../src/lambda/server/json-rpc';
import { FakeCloudWatchEvents, FakeECS, FakeKMS, FakeS3Sync } from './fakes';
import { RequestBuilder } from './request-builder';

export interface CustomWorld {
  request: RequestBuilder;
  lastResponse: any;
  lastResponseOk: boolean;
}

function CustomWorld(this: CustomWorld) {
  const fakeProviders = ReflectiveInjector.resolve([
    {
      provide: S3Sync,
      useClass: FakeS3Sync
    },
    {
      provide: KMS,
      useClass: FakeKMS
    },
    {
      provide: ECS,
      useClass: FakeECS
    },
    {
      provide: CloudWatchEvents,
      useClass: FakeCloudWatchEvents
    }
  ]);
  const injector      = ReflectiveInjector.fromResolvedProviders(fakeProviders.concat(providers));
  bootstrap(injector);
  const jsonRpcServer = injector.get(JsonRpcServer);

  this.request = new RequestBuilder(jsonRpcServer.handle.bind(jsonRpcServer), injector);
}

defineSupportCode(({ setWorldConstructor }) => {
  setWorldConstructor(CustomWorld);
});
