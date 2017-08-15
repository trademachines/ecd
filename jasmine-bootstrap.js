require('ts-node/register');
require('reflect-metadata');
const SpecReporter = require('jasmine-spec-reporter');

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(new SpecReporter());
