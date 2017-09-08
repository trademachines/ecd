import { ECS } from 'aws-sdk';
import { Injectable } from 'injection-js';
import { EventDispatcher } from './event-dispatcher';

@Injectable()
export class DeploymentService {
  constructor(private ecs: ECS, private eventDispatcher: EventDispatcher) {
  }

  /**
   * @param {object} config
   * @param {string} cluster
   * @param {string} service
   * @return {Promise}
   */
  deploy(config: object, cluster: string, service: string) {
    let taskDefArn;

    return this.getService(cluster, service)
      .then(ecsService => this.registerNewTaskDef(config as any).then(r => [ecsService, r.taskDefinition]))
      .then(([ecsService, taskDefinition]) => this.updateService(taskDefinition, cluster, service).then(() => [ecsService, taskDefinition]))
      .then(([oldService, taskDefinition]) => this.deregisterOldTaskDef(oldService).then(() => taskDefinition))
      .then(taskDefinition => this.dispatchSuccess(taskDefinition, cluster, service))
      .then(() => Promise.resolve({ taskDefinition: taskDefArn }));
  }

  private registerNewTaskDef(config: ECS.RegisterTaskDefinitionRequest) {
    return this.ecs.registerTaskDefinition(config as ECS.RegisterTaskDefinitionRequest).promise();
  }

  private deregisterOldTaskDef(service: ECS.Service) {
    return this.ecs.deregisterTaskDefinition({ taskDefinition: service.taskDefinition }).promise();
  }

  private getService(cluster: string, service: string) {
    return this.ecs.describeServices({ cluster: cluster, services: [service] }).promise()
      .then((res) => {
        let msg          = () => `Service '${service}' does not exist on cluster '${cluster}'`;
        let hasFailure   = res.failures && res.failures.length > 0;
        let hasNoService = res.services && res.services.length === 0;

        if (hasFailure || hasNoService) {
          return Promise.reject(msg());
        }

        let ecsService = res.services.find(s => s.serviceName === service);

        if (!ecsService) {
          return Promise.reject(msg());
        }

        return Promise.resolve(ecsService);
      });
  }

  private updateService(taskDef: ECS.TaskDefinition, cluster: string, service: string) {
    return this.ecs.updateService({
      cluster: cluster,
      service: service,
      taskDefinition: taskDef.taskDefinitionArn
    }).promise();
  }

  private dispatchSuccess(taskDef: ECS.TaskDefinition, cluster: string, service: string) {
    const detail = {
      cluster: cluster,
      service: service,
      taskDefinition: `${taskDef.family}:${taskDef.revision}`,
      taskDefinitionArn: taskDef.taskDefinitionArn
    };

    return this.eventDispatcher.succeeded(detail);
  }
}
