'use strict';

const _         = require('lodash');
const program   = require('commander');
const client    = require('./client');
const apiClient = new client.ApiClient(process.cwd());

const finish = (data, exitCode) => {
  console.log('An error occured while processing the command:');
  console.log(JSON.stringify(data, null, 2));
  process.exit(exitCode);
};

const callApi = (method, environment, service) => {
  const configFile = program.configFile;
  const varFile    = program.varFile;
  const variables  = program.var;

  apiClient.configure(program.region, program.function);
  return apiClient.call(method, environment, service, configFile, varFile, variables)
    .then((res) => {
      if (_.has(res, 'error')) {
        return Promise.reject(res.error);
      }

      return Promise.resolve(res);
    })
    .catch((err) => finish(err, 1));
};

const list = (val, memo) => {
  memo.push(val);
  return memo;
};

program
  .option('--region <value>', 'Set region', 'eu-west-1')
  .option('--function <value>', 'Set function name', 'ecd')
  .option('--config-file <value>', 'Config')
  .option('--var-file <value>', 'Variable file')
  .option('--var <value>', 'Variables', list, []);

program
  .command('validate <environment> <service>')
  .action((environment, service) => {
      callApi('validate', environment, service)
        .then(() => console.log(
          `Successfully validated service '${service}' in environment '${environment}'`)
        );
    }
  );

program
  .command('deploy <environment> <service>')
  .action((environment, service) => {
      callApi('deploy', environment, service)
        .then(() => console.log(
          `Successfully deployed service '${service}' in environment '${environment}'`)
        );
    }
  );

program.parse(process.argv);
