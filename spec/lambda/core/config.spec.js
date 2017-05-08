const ConfigBuilder = require('./../../../src/lambda/core/config').ConfigBuilder;
const fixtureDir    = __dirname + '/_fixtures/config';

describe('Config building', () => {
  let libuclParser;
  let libuclFactory;
  let kms;
  let kmsDecryptedValue;
  let configBuilder;
  const f = (f) => {
    return `${fixtureDir}/${f}`;
  };

  beforeEach(() => {
    kms           = {
      decrypt: () => {
        return {
          promise: () => {
            return Promise.resolve({Plaintext: new Buffer(kmsDecryptedValue)});
          }
        }
      }
    };
    libuclParser  = {
      addVariable: () => {
      },
      addString:   () => {
      },
      asJson:      () => {
        return {'my-service': {}};
      }
    };
    libuclFactory = {
      create: () => {
        return libuclParser;
      }
    };
    configBuilder = new ConfigBuilder(kms, libuclFactory);
  });
  afterEach(() => {
    delete process.env.AWS_REGION;
  });

  describe('variables file handling', () => {
    it('adds var files', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{type: 'variable', path: f('SOMEVAR.var')}];

      configBuilder.build(files, {cluster: 'my-cluster', service: 'my-service'}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SOMEVAR', 'some-value');
          done();
        },
        done.fail
      );
    });

    it('adds multiple variables for properties files', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{type: 'variable', path: f('vars.properties')}];

      configBuilder.build(files, {cluster: 'my-cluster', service: 'my-service'}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FIRST_VAR', 'first-value');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SECOND_VAR', 'second-value');
          done();
        },
        done.fail
      );
    });

    it('strips empty lines for properties files', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{type: 'variable', path: f('vars-with-empty-lines.properties')}];

      configBuilder.build(files, {cluster: 'my-cluster', service: 'my-service'}).then(
        () => {
          expect(libuclParser.addVariable).not.toHaveBeenCalledWith('', '');
          expect(libuclParser.addVariable).not.toHaveBeenCalledWith(jasmine.anything(), '');
          expect(libuclParser.addVariable).not.toHaveBeenCalledWith('', jasmine.anything());
          done();
        },
        done.fail
      );
    });

    it('splits variables with equal sign correctly', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{type: 'variable', path: f('vars-with-equal-sign.properties')}];

      configBuilder.build(files, {cluster: 'my-cluster', service: 'my-service'}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FIRST_VAR', 'first=value');
          done();
        },
        done.fail
      );
    });

    it('adds cluster+service as vars', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], {cluster: 'my-cluster', service: 'my-service'}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('CLUSTER', 'my-cluster');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SERVICE', 'my-service');
          done();
        },
        done.fail
      );
    });

    it('adds process environment variables as vars', (done) => {
      spyOn(libuclParser, 'addVariable');

      process.env.AWS_REGION = 'tm-west-1';

      configBuilder.build([], {service: 'my-service'}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('AWS_REGION', 'tm-west-1');
          done();
        },
        done.fail
      );
    });

    it('adds vars from context', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], {service: 'my-service', varContent: "SOME=THING\nFOO=BAR"}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SOME', 'THING');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FOO', 'BAR');
          done();
        },
        done.fail
      );
    });

    it('adds explicit vars from context', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], {service: 'my-service', vars: ["SOME=THING", "FOO=BAR"]}).then(
        () => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SOME', 'THING');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FOO', 'BAR');
          done();
        },
        done.fail
      );
    });
  });

  describe('config file handling', () => {
    it('adds files with content', (done) => {
      spyOn(libuclParser, 'addString');
      const files = [
        {type: 'config', path: f('empty.conf')},
        {type: 'config', path: f('non-empty.conf')},
      ];

      configBuilder.build(files, {cluster: 'my-cluster', service: 'my-service'}).then(
        () => {
          expect(libuclParser.addString).toHaveBeenCalledTimes(1);
          expect(libuclParser.addString).toHaveBeenCalledWith('containerDefinitions = []');
          done();
        },
        done.fail
      );
    });
  });

  describe('decrypting secure values', () => {
    it('decrypts plain objects with one single key named \'secure\'', (done) => {
      kmsDecryptedValue    = 'kms-decrypted';
      const encryptedValue = {secure: 'encrypted'};
      const json           = {
        'my-service': {
          'scalar': encryptedValue,
          'array':  ['one', 'two', encryptedValue],
          'object': {
            'scalar': encryptedValue,
            'array':  ['three', encryptedValue],
            'nested': {
              'scalar': encryptedValue
            }
          }
        }
      };
      spyOn(libuclParser, 'asJson').and.returnValue(json);

      configBuilder.build([], {cluster: 'my-cluster', service: 'my-service'}).then(
        (config) => {
          expect(config).toEqual(jasmine.objectContaining({
            'scalar': kmsDecryptedValue,
            'array':  ['one', 'two', kmsDecryptedValue],
            'object': {
              'scalar': kmsDecryptedValue,
              'array':  ['three', kmsDecryptedValue],
              'nested': {
                'scalar': kmsDecryptedValue
              }
            }
          }));
          done();
        },
        done.fail
      );
    });
  });

  describe('additional config modification', () => {
    it('calls modifier during config assembly', (done) => {
      class Modifer {
        constructor(number) {
          this.number = number;
        }

        modify(config) {
          config.containerDefinitions.push({modifier: this.number});
          return Promise.resolve(config);
        }
      }
      spyOn(libuclParser, 'asJson').and.returnValue({'my-service': {containerDefinitions: []}});

      configBuilder.addModifier(new Modifer(1));
      configBuilder.addModifier(new Modifer(2));
      configBuilder.build([], {cluster: 'my-cluster', service: 'my-service'}).then(
        (config) => {
          expect(config.containerDefinitions).toEqual([{modifier: 1}, {modifier: 2}]);

          done();
        },
        done.fail
      );
    });
  });
});
