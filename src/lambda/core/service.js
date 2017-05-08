const taskDefSchema    = require('./resources/task-definition.schema.json');
const ApplicationError = require('./../server/error').ApplicationError;

/**
 */
class ConfigValidationError extends ApplicationError {
  /**
   * @param {*} errors
   */
  constructor(errors) {
    super('Validating configuration file failed', {errors: errors});
  }
}

/**
 */
class DeploymentError extends ApplicationError {
  /**
   * @param {*} previous
   */
  constructor(previous) {
    super('Deployment of service failed', {previous: previous});
  }
}

module.exports.ConfigValidationError = ConfigValidationError;
module.exports.DeploymentError       = DeploymentError;

module.exports.EcdService = class {
  /**
   * @param {FileFinder} finder
   * @param {ConfigBuilder} configBuilder
   * @param {Ajv} ajv
   * @param {DeploymentService} deployment
   */
  constructor(finder, configBuilder, ajv, deployment) {
    this.finder        = finder;
    this.configBuilder = configBuilder;
    this.ajv           = ajv;
    this.deployment    = deployment;
  }

  /**
   * @param {object} context
   * @return {Promise}
   */
  deploy(context) {
    return this._prepare(context)
      .then((config) => this.deployment.deploy(config, context.cluster, context.service))
      .catch((err) => {
        if (!err instanceof ApplicationError) {
          err = new DeploymentError(err);
        }

        return Promise.reject(err);
      });
  }

  /**
   * @param {object} context
   * @return {Promise}
   */
  validate(context) {
    return this._prepare(context)
      .then((x) => Promise.resolve());
  }

  /**
   * @param {object} context
   * @return {Promise}
   */
  dump(context) {
    return this._createConfig(context);
  }

  /**
   * @param {object} context
   * @return {Promise}
   * @private
   */
  _prepare(context) {
    return this._createConfig(context)
      .then((config) => this._validateSchema(config))
      .catch((err) => Promise.reject(new ConfigValidationError(err)));
  }

  /**
   * @param {object} context
   * @return {Promise}
   */
  _createConfig(context) {
    return this._assertContext(context)
      .then(() => this.finder.find(context.cluster, context.service))
      .then((files) => this.configBuilder.build(files, context))
      ;
  }

  /**
   * @param {object} config
   * @return {Promise}
   * @private
   */
  _validateSchema(config) {
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
  _assertContext(context) {
    // TODO check how context object looks like, either with lodash or with ajv
    return Promise.resolve(context);
  }
};
