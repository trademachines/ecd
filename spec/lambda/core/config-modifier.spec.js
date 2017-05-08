const configModifierPath = './../../../src/lambda/core/config-modifier';
const configModifier     = require(configModifierPath);

describe('Config modifications', () => {
  describe('modify environment vars', () => {
    let envFromHashModifier;

    beforeEach(() => {
      envFromHashModifier = new configModifier.EnvironmentFromHashConfigModifier();
    });

    it('modifies environments defined as plain object', (done) => {
      const config = {
        containerDefinitions: [
          {
            environment: {
              foo: 'bar',
              bar: true,
              baz: 3.14
            }
          }
        ]
      };

      envFromHashModifier.modify(config).then(
        (conf) => {
          expect(conf.containerDefinitions[0].environment).toEqual([
            {name: 'foo', value: 'bar'},
            {name: 'bar', value: true},
            {name: 'baz', value: 3.14},
          ]);
          done();
        },
        done.fail
      );
    });

    it('does not modify environments defined as array', (done) => {
      const config = {
        containerDefinitions: [
          {
            environment: [1, 2, 3]
          }
        ]
      };

      envFromHashModifier.modify(config).then(
        (conf) => {
          expect(conf.containerDefinitions[0].environment).toEqual([1, 2, 3]);
          done();
        },
        done.fail
      );
    });
  });

  describe('modify port mappings', () => {
    let portsFromStringModifier;

    beforeEach(() => {
      portsFromStringModifier = new configModifier.PortMappingFromStringConfigModifier();
    });

    it('modifies portMappings defined as strings', (done) => {
      const config = {
        containerDefinitions: [
          {
            portMappings: ["80"]
          }
        ]
      };

      portsFromStringModifier.modify(config).then(
        (conf) => {
          expect(conf.containerDefinitions[0].portMappings).toEqual([
            {containerPort: 80, hostPort: 0},
          ]);
          done();
        },
        done.fail
      );
    });

    it('modifies portMappings defined as single number', (done) => {
      const config = {
        containerDefinitions: [
          {
            portMappings: [80]
          }
        ]
      };

      portsFromStringModifier.modify(config).then(
        (conf) => {
          expect(conf.containerDefinitions[0].portMappings).toEqual([
            {containerPort: 80, hostPort: 0},
          ]);
          done();
        },
        done.fail
      );
    });

    it('modifies portMappings defined as string with fixed host port', (done) => {
      const config = {
        containerDefinitions: [
          {
            portMappings: ["8080:80"]
          }
        ]
      };

      portsFromStringModifier.modify(config).then(
        (conf) => {
          expect(conf.containerDefinitions[0].portMappings).toEqual([
            {containerPort: 80, hostPort: 8080},
          ]);
          done();
        },
        done.fail
      );
    });
  });
});
