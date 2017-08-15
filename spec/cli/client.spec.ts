import { EcdClient } from '../../src/cli/client';

const AWS  = require('aws-sdk-mock');
const path = __dirname + '/_fixtures';

describe('Api Client', () => {
  let lambdaPayload = {};
  let lambda;
  let client: EcdClient;

  beforeEach(() => {
    lambda              = (_params, cb) => cb(null, { Payload: JSON.stringify(lambdaPayload) });
    client              = new EcdClient(path);
    client.region       = 'my-region';
    client.functionName = 'my-fn';
  });

  afterEach(() => AWS.restore());

  it('uses configured region', () => {
    const lambda = client.getLambdaClient();

    expect(lambda.config.region).toEqual('my-region');
  });

  it('calls configured lambda function', (done) => {
    let invoke = jasmine.createSpy('lambda.invoke').and.callFake(lambda);
    AWS.mock('Lambda', 'invoke', invoke);

    client.call('my-method', 'cluster', 'service')
      .then(() => {
        expect(invoke)
          .toHaveBeenCalledWith(jasmine.objectContaining({ FunctionName: 'my-fn' }), jasmine.anything());
      })
      .then(done)
      .catch(done.fail);
  });

  it('puts cluster and service into params', (done) => {
    let invoke = jasmine.createSpy('lambda.invoke').and.callFake(lambda);
    AWS.mock('Lambda', 'invoke', invoke);

    client.call('my-method', 'my-cluster', 'my-service')
      .then(() => {
        expect(invoke).toHaveBeenCalled();

        const payload = invoke.calls.argsFor(0)[0].Payload;
        expect(payload).toContain('"cluster":"my-cluster"');
        expect(payload).toContain('"service":"my-service"');
      })
      .then(done)
      .catch(done.fail);
  });

  it('puts file contents into params', (done) => {
    let invoke = jasmine.createSpy('lambda.invoke').and.callFake(lambda);
    AWS.mock('Lambda', 'invoke', invoke);

    client.call('my-method', 'cluster', 'service', 'service.conf', ['service.properties'])
      .then(() => {
        expect(invoke).toHaveBeenCalled();

        const payload = invoke.calls.argsFor(0)[0].Payload;
        expect(payload).toContain('"configContent":"service content"');
        expect(payload).toContain('"varContent":"properties content"');
      })
      .then(done)
      .catch(done.fail);
  });

  it('puts contents of multiple files into params', (done) => {
    let invoke = jasmine.createSpy('lambda.invoke').and.callFake(lambda);
    AWS.mock('Lambda', 'invoke', invoke);

    client.call('my-method', 'cluster', 'service', 'service.conf', ['service.properties', 'service-more.properties'])
      .then(() => {
        expect(invoke).toHaveBeenCalled();

        const payload = invoke.calls.argsFor(0)[0].Payload;
        expect(payload).toContain('"configContent":"service content"');
        expect(payload).toContain('"varContent":"properties content\\nmore properties content"');
      })
      .then(done)
      .catch(done.fail);
  });

  it('uses integer for json-rpc id', (done) => {
    let invoke = jasmine.createSpy('lambda.invoke').and.callFake(lambda);
    AWS.mock('Lambda', 'invoke', invoke);

    Promise.all([
      client.call('my-method', 'cluster', 'service', 'service.conf', ['service.properties']),
      client.call('my-method', 'cluster', 'service', 'service.conf', ['service.properties'])
    ])
      .then(() => {
        expect(invoke).toHaveBeenCalledTimes(2);
        expect(invoke.calls.argsFor(0)[0].Payload)
          .toContain('"id":1');
        expect(invoke.calls.argsFor(1)[0].Payload)
          .toContain('"id":2');
      })
      .then(done)
      .catch(done.fail);
  });

  it('extracts payload from response', (done) => {
    let invoke = jasmine.createSpy('lambda.invoke').and.callFake(lambda);
    AWS.mock('Lambda', 'invoke', invoke);
    lambdaPayload = { foo: 'bar' };

    client.call('my-method', 'cluster', 'service', 'service.conf', ['service.properties'])
      .then((response) => {
        expect(response).toEqual(lambdaPayload);
      })
      .then(done)
      .catch(done.fail);
  });
});
