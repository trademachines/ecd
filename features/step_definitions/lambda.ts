import { defineSupportCode } from 'cucumber';
import { CustomWorld } from '../support/world';

const COMMANDS = ['validate', 'dump', 'deploy'];

defineSupportCode(({ Given, When }) => {
  Given(/^I have the config$/, function (this: CustomWorld, config: string) {
    this.request.withConfig(config);
  });

  Given(/^I have a variable (.+) with value (.+)/, function (this: CustomWorld, key: string, value: string) {
    this.request.withVar(key, value);
  });

  When(/^I run (.+) on (.+)@(.+)$/, function (this: CustomWorld, command: string, service: string, cluster: string) {
    if (!COMMANDS.includes(command)) {
      throw new Error(`Can't handle ${command}`);
    }

    return this.request.run(command, cluster, service)
      .then(x => {
        if (x.error) {
          return Promise.reject(x);
        }

        this.lastResponse   = x;
        this.lastResponseOk = true;
      })
      .catch(x => {
        this.lastResponse   = x;
        this.lastResponseOk = false;
      });
  });
});
