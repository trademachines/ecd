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

      return Promise.resolve(res.result);
    })
    .catch((err) => finish(err, 1));
};

const list = (val, memo) => {
  memo.push(val);
  return memo;
};

/* eslint-disable max-len */
const regionDescription     = 'Sets the AWS region where the function resides. Defaults to \'eu-west-1\'.';
const functionDescription   = 'Set AWS Lambda function name that will be called. Defaults to \'ecd\'.';
const configFileDescription = 'Specify a filename that will be used to compute the ECS Task Definition.';
const varFileDescription    = 'Specify a filename where additional variables are stored. It should only contain lines with KEY=VALUE.';
/* eslint-enable max-len */

program
  .option('--region <value>', regionDescription, 'eu-west-1')
  .option('--function <value>', functionDescription, 'ecd')
  .option('--config-file <value>', configFileDescription)
  .option('--var-file <value>', varFileDescription)
  .option('--var <value>', 'Add additional variables in the KEY=VALUE format.', list, []);

program
  .command('validate <environment> <service>')
  .description('Validates the generated ECS Task Definition against a curated schema.')
  .action((environment, service) => {
      callApi('validate', environment, service)
        .then(() => console.log(
          `Successfully validated service '${service}' in environment '${environment}'`)
        );
    }
  );

program
  .command('deploy <environment> <service>')
  .description('Deploys the generated ECS Task Definition.')
  .action((environment, service) => {
      callApi('deploy', environment, service)
        .then(() => console.log(
          `Successfully deployed service '${service}' in environment '${environment}'`)
        );
    }
  );

program
  .command('dump <environment> <service>')
  .description('Outputs the generated ECS Task Definition without any validation.')
  .action((environment, service) => {
      callApi('dump', environment, service)
        .then((config) => console.log(JSON.stringify(config, null, 2)));
    }
  );

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
