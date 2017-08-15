import { Injectable } from 'injection-js';
import { EcdService } from '../core/ecd-service';
import { JsonRpcServer } from '../server/json-rpc';

@Injectable()
export class Api {
  constructor(server: JsonRpcServer, ecdService: EcdService) {
    server.add('deploy', ecdService.deploy.bind(ecdService));
    server.add('validate', ecdService.validate.bind(ecdService));
    server.add('dump', ecdService.dump.bind(ecdService));
  }
}
