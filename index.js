'use strict';

const os  = require('os');
const AWS = require('aws-sdk');
const Ajv = require('ajv');

const S3Sync            = require('./src/lambda/core/s3-sync').S3Sync;
const FileFinder        = require('./src/lambda/core/finder').FileFinder;
const EcdService        = require('./src/lambda/core/service').EcdService;
const ConfigBuilder     = require('./src/lambda/core/config').ConfigBuilder;
const LibuclFactory     = require('./src/lambda/core/libucl').LibuclFactory;
const DeploymentService = require('./src/lambda/core/deployment').DeploymentService;
const EventDispatcher = require('./src/lambda/core/event-dispatcher').EventDispatcher;

const syncDir = os.tmpDir() + '/_sync/';
const bucket  = process.env.BUCKET || 'tm-ecd-configs';
const region  = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-1';

process.env.AWS_REGION = region;

const s3Sync            = new S3Sync(new AWS.S3(), bucket, syncDir);
const fileFinder        = new FileFinder(s3Sync);
const configBuilder     = new ConfigBuilder(new AWS.KMS({region: region}), new LibuclFactory());
const deploymentService = new DeploymentService(
  new AWS.ECS({region: region}),
  new EventDispatcher(new AWS.CloudWatchEvents({region: region}))
);
const ecdService        = new EcdService(fileFinder, configBuilder, new Ajv(), deploymentService);

const server = require('./src/lambda/server');
const api    = require('./src/lambda/api');

const jsonRpcserver = new server.JsonRpcServer();

new api.Api(jsonRpcserver, ecdService);

exports.handle = jsonRpcserver.handle.bind(jsonRpcserver);
