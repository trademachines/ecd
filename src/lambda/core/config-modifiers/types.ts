export interface ConfigModifier {
  modify(config: any): Promise<any>;
}
