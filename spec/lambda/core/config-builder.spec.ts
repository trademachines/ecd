import { ConfigBuilder } from '../../../src/lambda/core/config-builder';

const fixtureDir = __dirname + '/_fixtures/config';

describe('Config building', () => {
  let libuclParser;
  let libuclFactory;
  let configBuilder;
  let awsContext;
  const f = (f) => {
    return `${fixtureDir}/${f}`;
  };

  beforeEach(() => {
    awsContext    = {
      invokedFunctionArn: 'arn:aws:lambda:tm-west-1:123456789012:function:ecd'
    };
    libuclParser  = {
      addVariable: () => {
      },
      addString: () => {
      },
      asJson: () => {
        return { 'my-service': {} };
      }
    };
    libuclFactory = {
      create: () => {
        return libuclParser;
      }
    };
    configBuilder = new ConfigBuilder(libuclFactory);
  });

  describe('variables file handling', () => {
    it('adds var files', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{ type: 'variable', path: f('SOMEVAR.var') }];

      configBuilder.build(files, { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SOMEVAR', 'some-value');
        })
        .then(done)
        .catch(done.fail);
    });

    it('adds multiple variables for properties files', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{ type: 'variable', path: f('vars.properties') }];

      configBuilder.build(files, { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FIRST_VAR', 'first-value');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SECOND_VAR', 'second-value');
        })
        .then(done)
        .catch(done.fail);
    });

    it('strips empty lines for properties files', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{ type: 'variable', path: f('vars-with-empty-lines.properties') }];

      configBuilder.build(files, { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).not.toHaveBeenCalledWith('', '');
          expect(libuclParser.addVariable).not.toHaveBeenCalledWith(jasmine.anything(), '');
          expect(libuclParser.addVariable).not.toHaveBeenCalledWith('', jasmine.anything());
        })
        .then(done)
        .catch(done.fail);
    });

    it('splits variables with equal sign correctly', (done) => {
      spyOn(libuclParser, 'addVariable');
      const files = [{ type: 'variable', path: f('vars-with-equal-sign.properties') }];

      configBuilder.build(files, { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FIRST_VAR', 'first=value');
        })
        .then(done)
        .catch(done.fail);
    });

    it('adds cluster+service as vars', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('CLUSTER', 'my-cluster');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SERVICE', 'my-service');
        })
        .then(done)
        .catch(done.fail);
    });

    it('adds context information from runtime as vars', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], { service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('AWS_REGION', 'tm-west-1');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('AWS_ACCOUNT_ID', '123456789012');
        })
        .then(done)
        .catch(done.fail);
    });

    it('adds vars from context', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], { service: 'my-service', varContent: "SOME=THING\nFOO=BAR" }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SOME', 'THING');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FOO', 'BAR');
        })
        .then(done)
        .catch(done.fail);
    });

    it('adds explicit vars from context', (done) => {
      spyOn(libuclParser, 'addVariable');

      configBuilder.build([], { service: 'my-service', vars: ["SOME=THING", "FOO=BAR"] }, awsContext)
        .then(() => {
          expect(libuclParser.addVariable).toHaveBeenCalledWith('SOME', 'THING');
          expect(libuclParser.addVariable).toHaveBeenCalledWith('FOO', 'BAR');
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('config file handling', () => {
    it('adds files with content', (done) => {
      spyOn(libuclParser, 'addString');
      const files = [
        { type: 'config', path: f('empty.conf') },
        { type: 'config', path: f('non-empty.conf') },
      ];

      configBuilder.build(files, { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then(() => {
          expect(libuclParser.addString).toHaveBeenCalledTimes(1);
          expect(libuclParser.addString).toHaveBeenCalledWith('containerDefinitions = []');
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('additional config modification', () => {
    it('calls modifier during config assembly', (done) => {
      class Modifer {
        constructor(private number) {
        }

        modify(config) {
          config.containerDefinitions.push({ modifier: this.number });
          return Promise.resolve(config);
        }
      }

      spyOn(libuclParser, 'asJson').and.returnValue({ 'my-service': { containerDefinitions: [] } });

      configBuilder.addModifier(new Modifer(1));
      configBuilder.addModifier(new Modifer(2));
      configBuilder.build([], { cluster: 'my-cluster', service: 'my-service' }, awsContext)
        .then((config) => {
          expect(config.containerDefinitions).toEqual([{ modifier: 1 }, { modifier: 2 }]);
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
