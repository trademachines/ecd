import { Injector, Provider } from 'injection-js';
import { ConfigBuilder } from './config-builder';
import {
  DecryptSecureValuesConfigModifier, EnvironmentFromHashConfigModifier, PortMappingFromStringConfigModifier
} from './config-modifiers';
import { DeploymentService } from './deployment-service';
import { EcdService } from './ecd-service';
import { EventDispatcher } from './event-dispatcher';
import { FileFinder } from './finder';
import { LibuclFactory, LibuclParser } from './libucl';
import { S3Sync } from './s3-sync';

export function providers(): Provider[] {
  return [
    LibuclFactory, LibuclParser,
    ConfigBuilder,
    EnvironmentFromHashConfigModifier, PortMappingFromStringConfigModifier, DecryptSecureValuesConfigModifier,
    DeploymentService,
    EventDispatcher,
    FileFinder,
    S3Sync,
    EcdService
  ];
}

export function bootstrap(injector: Injector): void {
  const configBuilder = injector.get(ConfigBuilder);
  configBuilder.addModifier(injector.get(DecryptSecureValuesConfigModifier));
  configBuilder.addModifier(injector.get(EnvironmentFromHashConfigModifier));
  configBuilder.addModifier(injector.get(PortMappingFromStringConfigModifier));
}
