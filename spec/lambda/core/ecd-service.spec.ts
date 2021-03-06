import { EcdService } from '../../../src/lambda/core/ecd-service';

describe('ECD Service', () => {
  let finder;
  let configBuilder;
  let ajv;
  let foundFiles;
  let config;
  let validSchema;
  let ecdService;

  beforeEach(() => {
    foundFiles    = [];
    config        = {};
    validSchema   = true;
    finder        = {
      find: () => {
        return Promise.resolve(foundFiles);
      }
    };
    configBuilder = {
      build: () => {
        return Promise.resolve(config);
      }
    };
    ajv           = {
      validate: () => {
        return validSchema;
      },
      errors: []
    };
    ecdService    = new EcdService(finder, configBuilder, ajv, null as any);
  });

  it('only accepts valid context objects', () => {
  });

  it('finds files with cluster and service', (done) => {
    spyOn(finder, 'find').and.callThrough();

    ecdService.validate({ cluster: 'my-cluster', service: 'my-service' })
      .then(() => {
        expect(finder.find).toHaveBeenCalledWith('my-cluster', 'my-service');
      })
      .then(done)
      .catch(done.fail);
  });

  describe('validation behaviour', () => {
    it('rejects on invalid config', (done) => {
      validSchema = false;
      ajv.errors  = [{ something: 'went wrong' }];

      ecdService.validate({ cluster: 'my-cluster', service: 'my-service' })
        .then(done.fail)
        .catch((err) => {
          expect(err.details.errors).toEqual(ajv.errors);
        })
        .then(done);
    });
  });
});
