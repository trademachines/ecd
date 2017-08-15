import { ApplicationError } from '../../../src/lambda/server/errors';
import { JsonRpcServer } from '../../../src/lambda/server/json-rpc';

describe('Json-Rpc server', () => {
  let jsonRpcServer;
  let event;

  beforeEach(() => {
    jsonRpcServer = new JsonRpcServer();
    event         = {
      method: 'something',
      params: ['foo', {}],
      id: 'a1b2'
    };
  });

  it('accepts correct schema', () => {
    expect(JsonRpcServer.isValidEvent(event))
      .toBe(true);
  });

  it('complains about unregistered method', () => {
    jsonRpcServer.handle(event, {}, (err) => {
      expect(err).toEqual(jasmine.any(Error));
      expect(err.message).toEqual('Method "something" is not registered.');
    });
  });

  it('wraps responses into json rpc object', (done) => {
    const result = { my: 'result' };
    jsonRpcServer.add('something', () => {
      return Promise.resolve(result);
    });

    jsonRpcServer.handle(event, {}, (err, response) => {
      if (err) {
        return done.fail(err);
      }

      expect(response).toEqual(jasmine.objectContaining({ result: result }));
      done();
    });
  });

  it('wraps application errors into json rpc object', (done) => {
    const details = { some: 'details' };
    jsonRpcServer.add('something', () => {
      return Promise.reject(new ApplicationError('failure', details));
    });

    jsonRpcServer.handle(event, {}, (err, response) => {
      if (err) {
        return done.fail(err);
      }

      expect(response).toEqual(jasmine.objectContaining({
        error: { code: -1, message: 'failure', details: details }
      }));
      done();
    });
  });
});
