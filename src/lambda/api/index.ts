import { Injector, Provider } from 'injection-js';
import { Api } from './api';


export function providers(): Provider[] {
  return [Api];
}

export function bootstrap(injector: Injector): void {
  // touch Api once so that the methods are attached
  injector.get(Api);
}
