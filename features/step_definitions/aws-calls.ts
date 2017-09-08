import { ECS } from 'aws-sdk';
import { expect } from 'chai';
import { defineSupportCode } from 'cucumber';
import { FakeECS } from '../support/fakes';
import { CustomWorld } from '../support/world';

defineSupportCode(({ Given, Then }) => {
  Given(/^there is a service$/, function (this: CustomWorld, service: string) {
    let ecs = this.request.get(ECS) as any as FakeECS;
    service = JSON.parse(service);

    ecs.services.push(service as ECS.Service);
  });

  Then(/^a task definition should be registered with$/, function (this: CustomWorld, taskDef: string) {
    let ecs          = this.request.get(ECS) as any as FakeECS;
    let registerCall = ecs.getCall('registerTaskDefinition');

    expect(registerCall).to.deep.equal(JSON.parse(taskDef));
  });

  Then(/^the service (.+)@(.+) should be updated$/, function (this: CustomWorld, service: string, cluster: string) {
    let ecs        = this.request.get(ECS) as any as FakeECS;
    let updateCall = ecs.getCall('updateService');

    expect(updateCall).to.include({ cluster: cluster, service: service });
  })
});
