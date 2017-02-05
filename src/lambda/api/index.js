'use strict';

module.exports.Api = class {
  /**
   *
   * @param {JsonRpcServer} server
   * @param {EcdService} ecdService
   */
  constructor(server, ecdService) {
    server.add('deploy', ecdService.deploy.bind(ecdService));
    server.add('validate', ecdService.validate.bind(ecdService));
    server.add('dump', ecdService.dump.bind(ecdService));
  }
};
