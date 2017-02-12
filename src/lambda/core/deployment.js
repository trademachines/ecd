'use strict';

module.exports.DeploymentService = class {
  /**
   * @param {AWS.ECS} ecs
   * @param {EventDispatcher} eventDispatcher
   */
  constructor(ecs, eventDispatcher) {
    this.ecs             = ecs;
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * @param {object} config
   * @param {string} cluster
   * @param {string} service
   * @return {Promise}
   */
  deploy(config, cluster, service) {
    let taskDefArn;

    return this.ecs.registerTaskDefinition(config).promise()
      .then((registerTaskDefRes) => {
        taskDefArn = registerTaskDefRes.taskDefinition.taskDefinitionArn;

        return this.ecs.updateService({
          cluster: cluster,
          service: service,
          taskDefinition: taskDefArn
        }).promise();
      })
      .then((x) => {
        const detail = {
          cluster: cluster,
          service: service,
          taskDefinition: taskDefArn
        };

        return this.eventDispatcher.succeeded(detail);
      })
      .then((x) => Promise.resolve({taskDefinition: taskDefArn}));
  }
};
