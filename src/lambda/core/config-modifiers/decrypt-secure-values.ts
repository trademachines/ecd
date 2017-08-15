import { ConfigModifier } from './types';

export class DecryptSecureValuesConfigModifier implements ConfigModifier {
  modify(config: any): Promise<any> {
    return Promise.resolve(config);
  }
}
