const _                 = require('lodash');
const DeploymentService = require('./../../../src/lambda/core/deployment').DeploymentService;

describe('Deployment service', () => {
  let ecs;
  let eventDispatcher;
  let deployment;

  let promiseReject;
  let promiseResolve;

  beforeEach(() => {
    promiseReject   = (val) => {
      return {
        promise: () => {
          return Promise.reject(val);
        }
      }
    };
    promiseResolve  = (val) => {
      return {
        promise: () => {
          return Promise.resolve(val);
        }
      }
    };
    ecs             = {
      registerTaskDefinition: () => {
      },
      updateService: () => {
      }
    };
    eventDispatcher = {
      succeeded: () => {

      },
      failed: () => {

      }
    };
    deployment      = new DeploymentService(ecs, eventDispatcher);
  });

  it('registers task definition', (done) => {
    const config = {my: 'config'};
    spyOn(ecs, 'registerTaskDefinition').and.callFake(_.partial(promiseReject, {errors: []}));

    deployment.deploy(config, 'my-cluster', 'my-service').then(
      done.fail,
      () => {
        expect(ecs.registerTaskDefinition).toHaveBeenCalledWith(config);
        done();
      }
    );
  });

  it('updates service after registering task definition', (done) => {
    const registerTaskDefResponse = {taskDefinition: {taskDefinitionArn: 'arn'}};
    spyOn(ecs, 'registerTaskDefinition')
      .and.callFake(_.partial(promiseResolve, registerTaskDefResponse));
    spyOn(ecs, 'updateService')
      .and.callFake(_.partial(promiseReject, {}));

    deployment.deploy({}, 'my-cluster', 'my-service').then(
      done.fail,
      () => {
        expect(ecs.updateService).toHaveBeenCalledWith({
          cluster: 'my-cluster',
          service: 'my-service',
          taskDefinition: 'arn'
        });
        done();
      }
    );
  });

  it('dispatches event after updating service', (done) => {
    const registerTaskDefResponse = {taskDefinition: {taskDefinitionArn: 'arn'}};
    spyOn(ecs, 'registerTaskDefinition')
      .and.callFake(_.partial(promiseResolve, registerTaskDefResponse));
    spyOn(ecs, 'updateService')
      .and.callFake(_.partial(promiseResolve, {}));
    spyOn(eventDispatcher, 'succeeded').and.callFake(_.partial(promiseResolve, {}));

    deployment.deploy({}, 'my-cluster', 'my-service').then(
      () => {
        expect(eventDispatcher.succeeded).toHaveBeenCalledWith({
          cluster: 'my-cluster',
          service: 'my-service',
          taskDefinition: 'arn'
        });
        done();
      },
      done.fail
    );
  });
});
