import { ECS } from 'aws-sdk';
import { EventDispatcher } from './event-dispatcher';
import { Injectable } from 'injection-js';

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

    return this.registerNewTaskDef(config as ECS.RegisterTaskDefinitionRequest)
      .then((taskDefArn) => this.updateService(taskDefArn, cluster, service).then(() => taskDefArn))
      .then((taskDefArn) => this.dispatchSuccess(taskDefArn, cluster, service))
      .then(() => Promise.resolve({ taskDefinition: taskDefArn }));
  }

  private registerNewTaskDef(config: ECS.RegisterTaskDefinitionRequest) {
    return this.ecs.registerTaskDefinition(config as ECS.RegisterTaskDefinitionRequest).promise()
      .then((registerTaskDefRes) => registerTaskDefRes.taskDefinition.taskDefinitionArn);
  }

  private updateService(taskDefArn: string, cluster: string, service: string) {
    return this.ecs.updateService({
      cluster: cluster,
      service: service,
      taskDefinition: taskDefArn
    }).promise();
  }

  private dispatchSuccess(taskDefArn: string, cluster: string, service: string) {
    const detail = {
      cluster: cluster,
      service: service,
      taskDefinition: taskDefArn
    };

    return this.eventDispatcher.succeeded(detail);
  }
}
