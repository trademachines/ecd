'use strict';

const _                = require('lodash');
const ApplicationError = require('./error').ApplicationError;

module.exports.JsonRpcServer = class JsonRpcServer {
  /**
   */
  constructor() {
    this.routes = {};
  }

  /**
   * @param {Object} event
   * @param {Object} context
   * @param {*} cb
   * @return {*}
   */
  handle(event, context, cb) {
    try {
      if (!JsonRpcServer.isValidEvent(event)) {
        return cb(new Error('Payload is not in a valid RPC format.'));
      }

      const method = event.method;
      if (!_.has(this.routes, method)) {
        return cb(new Error(`Method "${method}" is not registered.`));
      }

      const route = this.routes[method];
      route.apply(route, event.params)
        .then((res) => cb(null, {result: res || null, id: event.id}))
        .catch((err) => {
          let errMessage;
          let errDetails;

          if (err instanceof ApplicationError) {
            errMessage = err.message;
            errDetails = err.details;
          } else if (err instanceof Error) {
            errMessage = err.message;
          } else {
            errMessage = 'An unknown error occured';
          }

          const error = {
            code: -1,
            message: errMessage,
            details: errDetails
          };

          cb(null, {error: error, id: event.id});
        });
    } catch (e) {
      console.log(JSON.stringify(e));
      cb(e);
    }
  }

  /**
   * @param {string} method
   * @param {*} fn
   */
  add(method, fn) {
    this.routes[method] = fn;
  }

  /**
   * @param {*} event
   * @return {boolean}
   */
  static isValidEvent(event) {
    return _.has(event, 'method') && _.isString(event.method)
           && _.has(event, 'params') && _.isArray(event.params)
           && _.has(event, 'id');
  }
};
