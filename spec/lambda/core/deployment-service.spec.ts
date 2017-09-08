import { ECS } from 'aws-sdk';
import * as _ from 'lodash';
import { DeploymentService } from '../../../src/lambda/core/deployment-service';

describe('Deployment service', () => {
  let ecs;
  let eventDispatcher;
  let deployment;
  let ecsService: ECS.Service;
  let ecsTaskDefinition: ECS.TaskDefinition;

  let promiseReject;
  let promiseResolve;

  beforeEach(() => {
    promiseReject     = (val) => ({ promise: () => Promise.reject(val) });
    promiseResolve    = (val) => ({ promise: () => Promise.resolve(val) });
    ecs               = {
      describeServices: () => promiseResolve({ services: [ecsService] }),
      registerTaskDefinition: () => promiseResolve({ taskDefinition: ecsTaskDefinition }),
      deregisterTaskDefinition: () => promiseResolve(),
      updateService: () => promiseResolve()
    };
    eventDispatcher   = {
      succeeded: () => Promise.resolve(),
      failed: () => {
      }
    };
    deployment        = new DeploymentService(ecs, eventDispatcher);
    ecsService        = {
      clusterArn: 'arn:aws:ecs:eu-test-1:xxxxxxxxxxxx:cluster/my-cluster',
      serviceArn: 'arn:aws:ecs:eu-test-1:xxxxxxxxxxxx:service/my-service',
      serviceName: 'my-service'
    };
    ecsTaskDefinition = {
      taskDefinitionArn: 'arn:aws:ecs:eu-test-1:xxxxxxxxxxxx:task-definition/my-service:2611'
    }
  });

  it('complains about a non-existing service', (done) => {
    spyOn(ecs, 'describeServices').and.callFake(() => promiseResolve({ failures: [{}], services: [] }));

    deployment.deploy({}, 'my-cluster', 'my-service')
      .then(done.fail)
      .catch(err => {
        expect(err).toEqual(`Service 'my-service' does not exist on cluster 'my-cluster'`);
      })
      .then(done);
  });

  it('registers task definition', (done) => {
    const config = { my: 'config' };
    spyOn(ecs, 'registerTaskDefinition').and.callFake(_.partial(promiseReject, { errors: [] }));

    deployment.deploy(config, 'my-cluster', 'my-service')
      .then(done.fail)
      .catch(() => {
        expect(ecs.registerTaskDefinition).toHaveBeenCalledWith(config);
      })
      .then(done);
  });

  it('updates service after registering task definition', (done) => {
    const registerTaskDefResponse = { taskDefinition: { taskDefinitionArn: 'arn' } };
    spyOn(ecs, 'registerTaskDefinition').and.callFake(() => promiseResolve(registerTaskDefResponse));
    spyOn(ecs, 'updateService').and.callFake(() => promiseReject({}));

    deployment.deploy({}, 'my-cluster', 'my-service')
      .then(done.fail)
      .catch(() => {
        expect(ecs.updateService).toHaveBeenCalledWith({
          cluster: 'my-cluster',
          service: 'my-service',
          taskDefinition: 'arn'
        });
      })
      .then(done);
  });

  it('invalidates old task definition after updating service', (done) => {
    ecsService.taskDefinition = 'my-old-service:2611';
    spyOn(ecs, 'describeServices').and.callFake(() => promiseResolve({ services: [ecsService] }));
    spyOn(ecs, 'deregisterTaskDefinition').and.callThrough();

    deployment.deploy({}, 'my-cluster', 'my-service')
      .then(() => {
        expect(ecs.deregisterTaskDefinition).toHaveBeenCalledWith({
          taskDefinition: 'my-old-service:2611'
        });
      })
      .then(done)
      .catch(done.fail)
  });

  it('dispatches event after updating service', (done) => {
    spyOn(eventDispatcher, 'succeeded').and.callThrough();
    ecsTaskDefinition.taskDefinitionArn = 'some-arn';
    ecsTaskDefinition.family            = 'the-service';
    ecsTaskDefinition.revision          = 2611;

    deployment.deploy({}, 'my-cluster', 'my-service')
      .then(() => {
        expect(eventDispatcher.succeeded).toHaveBeenCalledWith({
          cluster: 'my-cluster',
          service: 'my-service',
          taskDefinition: 'the-service:2611',
          taskDefinitionArn: 'some-arn'
        });
      })
      .then(done)
      .catch(done.fail);
  });
});
