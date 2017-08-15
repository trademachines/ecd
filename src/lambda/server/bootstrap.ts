import { Provider } from 'injection-js';
import { JsonRpcServer } from './json-rpc';

export function providers(): Provider[] {
  return [JsonRpcServer];
}
