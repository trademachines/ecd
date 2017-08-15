import { EventDispatcher } from '../../../src/lambda/core/event-dispatcher';

describe('Event dispatching', () => {
  let cloudwatchEvents;
  let eventDispatcher;

  beforeEach(() => {
    cloudwatchEvents = {
      putEvents: () => {
        return {
          promise: () => {
            return Promise.resolve();
          }
        }
      }
    };
    eventDispatcher  = new EventDispatcher(cloudwatchEvents);
  });

  it('dispatches event for successful deployment', (done) => {
    const detail = { foo: 'bar', bar: 'foo' };
    spyOn(cloudwatchEvents, 'putEvents').and.callThrough();

    eventDispatcher.succeeded(detail)
      .then(() => {
        expect(cloudwatchEvents.putEvents)
          .toHaveBeenCalledWith(
            {
              Entries: [jasmine.objectContaining({
                Source: 'tm.ecd',
                DetailType: 'ECD Service Deployment Started',
                Detail: JSON.stringify({ foo: 'bar', bar: 'foo' })
              })]
            }
          );
      })
      .then(done)
      .catch(done.fail);
  });
});
