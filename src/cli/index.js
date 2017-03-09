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

const callApi = (method, cluster, service) => {
  const configFile = program.configFile;
  const varFile    = program.varFile;
  const variables  = program.var;

  apiClient.configure(program.region, program.function);
  return apiClient.call(method, cluster, service, configFile, varFile, variables)
    .then((res) => {
      if (_.has(res, 'errorMessage')) {
        return Promise.reject(res.errorMessage);
      }

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
  .command('validate <cluster> <service>')
  .description('Validates the generated ECS Task Definition against a curated schema.')
  .action((cluster, service) => {
      callApi('validate', cluster, service)
        .then(() => console.log(
          `Successfully validated service '${service}' in cluster '${cluster}'`)
        );
    }
  );

program
  .command('deploy <cluster> <service>')
  .description('Deploys the generated ECS Task Definition.')
  .action((cluster, service) => {
      callApi('deploy', cluster, service)
        .then(() => console.log(
          `Successfully deployed service '${service}' in cluster '${cluster}'`)
        );
    }
  );

program
  .command('dump <cluster> <service>')
  .description('Outputs the generated ECS Task Definition without any validation.')
  .action((cluster, service) => {
      callApi('dump', cluster, service)
        .then((config) => console.log(JSON.stringify(config, null, 2)));
    }
  );

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
