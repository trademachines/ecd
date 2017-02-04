'use strict';

const mock      = require('mock-fs');
const AWS       = require('aws-sdk');
const ApiClient = require('./../../src/cli/client').ApiClient;

describe('Api Client', () => {
  const path        = '/my/path';
  const mockedFs    = {};
  mockedFs[path]    = {
    'service.conf': 'service content',
    'service.properties': 'properties content'
  };
  let lambdaPayload = {};
  let lambda;
  let client;

  beforeEach(() => {
    lambda = {
      invoke: () => {
        return {
          promise: () => Promise.resolve({Payload: JSON.stringify(lambdaPayload)})
        };
      }
    };
    client = new ApiClient(path);
    mock(mockedFs);
  });

  afterEach(() => {
    mock.restore();
  });

  it('uses configured region', () => {
    client.configure('my-region', 'my-fn');
    const lambda = client._getLambdaClient();

    expect(lambda.config.region).toEqual('my-region');
  });

  it('calls configured lambda function', (done) => {
    spyOn(AWS, 'Lambda').and.returnValue(lambda);
    spyOn(lambda, 'invoke').and.callThrough();
    client.configure('my-region', 'my-fn');

    client.call('my-method', 'env', 'service').then(
      (res) => {
        expect(lambda.invoke)
          .toHaveBeenCalledWith(jasmine.objectContaining({FunctionName: 'my-fn'}));

        done();
      },
      done.fail
    );
  });

  it('puts environment and service into params', (done) => {
    spyOn(AWS, 'Lambda').and.returnValue(lambda);
    spyOn(lambda, 'invoke').and.callThrough();
    client.configure('my-region', 'my-fn');

    client.call('my-method', 'env', 'service').then(
      (res) => {
        expect(lambda.invoke).toHaveBeenCalled();

        const payload = lambda.invoke.calls.argsFor(0)[0].Payload;
        expect(payload).toContain('"environment":"env"');
        expect(payload).toContain('"service":"service"');

        done();
      },
      function () {
        console.log(arguments);
        done.fail();
      }
    );
  });

  it('puts file contents into params', (done) => {
    spyOn(AWS, 'Lambda').and.returnValue(lambda);
    spyOn(lambda, 'invoke').and.callThrough();
    client.configure('my-region', 'my-fn');

    client.call('my-method', 'env', 'service', 'service.conf', 'service.properties').then(
      () => {
        expect(lambda.invoke).toHaveBeenCalled();

        const payload = lambda.invoke.calls.argsFor(0)[0].Payload;
        expect(payload).toContain('"configContent":"service content"');
        expect(payload).toContain('"varContent":"properties content"');

        done();
      },
      done.fail
    );
  });

  it('uses integer for json-rpc id', (done) => {
    spyOn(AWS, 'Lambda').and.returnValue(lambda);
    spyOn(lambda, 'invoke').and.callThrough();
    client.configure('my-region', 'my-fn');

    Promise.all([
      client.call('my-method', 'env', 'service', 'service.conf', 'service.properties'),
      client.call('my-method', 'env', 'service', 'service.conf', 'service.properties')
    ]).then(
      () => {
        expect(lambda.invoke).toHaveBeenCalledTimes(2);
        expect(lambda.invoke.calls.argsFor(0)[0].Payload)
          .toContain('"id":1');
        expect(lambda.invoke.calls.argsFor(1)[0].Payload)
          .toContain('"id":2');

        done();
      },
      done.fail
    );
  });

  it('extracts payload from response', (done) => {
    spyOn(AWS, 'Lambda').and.returnValue(lambda);
    spyOn(lambda, 'invoke').and.callThrough();
    client.configure('my-region', 'my-fn');
    lambdaPayload = {foo: 'bar'};

    client.call('my-method', 'env', 'service', 'service.conf', 'service.properties')
      .then(
        (response) => {
          expect(response).toEqual(lambdaPayload);
          done();
        },
        done.fail
      );

  });

});
