import { Ajv } from 'ajv';
import { Context } from 'aws-lambda';
import { Inject, Injectable } from 'injection-js';
import * as _ from 'lodash';
import { ApplicationError } from '../server/errors';
import { ConfigBuilder } from './config-builder';
import { DeploymentService } from './deployment-service';
import { FileFinder } from './finder';

const taskDefSchema = require('./../../_resources/task-definition.schema.json');

export class ConfigValidationError extends ApplicationError {
  constructor(errors: any[]) {
    super(
      'Validating configuration file failed',
      { errors: errors.map(x => x instanceof Error ? x.message : x) }
    );
  }
}

export class DeploymentError extends ApplicationError {
  constructor(previous: any) {
    super('Deployment of service failed', { previous: previous });
  }
}

@Injectable()
export class EcdService {
  constructor(private finder: FileFinder,
              private configBuilder: ConfigBuilder,
              @Inject('ajv') private ajv: Ajv,
              private deployment: DeploymentService) {
  }

  /**
   * @param {object} context
   * @param {Context} awsContext
   * @return {Promise}
   */
  deploy(context, awsContext: Context) {
    return this.prepare(context, awsContext)
      .then(config => this.deployment.deploy(config, context.cluster, context.service))
      .catch(err => {
        if (!(err instanceof ApplicationError)) {
          err = new DeploymentError(err);
        }

        return Promise.reject(err);
      });
  }

  /**
   * @param {object} context
   * @param {Context} awsContext
   * @return {Promise}
   */
  validate(context, awsContext: Context) {
    return this.prepare(context, awsContext)
      .then(() => Promise.resolve());
  }

  /**
   * @param {object} context
   * @param {Context} awsContext
   * @return {Promise}
   */
  dump(context, awsContext: Context) {
    return this.createConfig(context, awsContext);
  }

  /**
   * @param {object} context
   * @param {Context} awsContext

   * @return {Promise}
   * @private
   */
  private prepare(context, awsContext: Context) {
    return this.createConfig(context, awsContext)
      .then((config) => this.validateSchema(config))
      .catch((err) => Promise.reject(new ConfigValidationError(_.isArray(err) ? err : [err])));
  }

  /**
   * @param {object} context
   * @param {Context} awsContext
   *
   * @return {Promise}
   */
  private createConfig(context, awsContext: Context) {
    return this.assertContext(context)
      .then(() => this.finder.find(context.cluster, context.service))
      .then((files) => this.configBuilder.build(files, context, awsContext));
  }

  /**
   * @param {object} config
   * @return {Promise}
   * @private
   */
  private validateSchema(config) {
    const valid = this.ajv.validate(taskDefSchema, config);

    if (!valid) {
      return Promise.reject(this.ajv.errors);
    }

    return Promise.resolve(config);
  }

  /**
   * @param {object} context
   * @return {Promise}
   */
  private assertContext(context) {
    // TODO check how context object looks like, either with lodash or with ajv
    return Promise.resolve(context);
  }
}
