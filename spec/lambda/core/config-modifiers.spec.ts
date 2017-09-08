import {
  DecryptSecureValuesConfigModifier, EnvironmentFromHashConfigModifier, PortMappingFromStringConfigModifier
} from '../../../src/lambda/core/config-modifiers';

describe('Config modifications', () => {
  describe('modify environment vars', () => {
    let envFromHashModifier;

    beforeEach(() => {
      envFromHashModifier = new EnvironmentFromHashConfigModifier();
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

      envFromHashModifier.modify(config)
        .then((conf) => {
          expect(conf.containerDefinitions[0].environment).toEqual([
            { name: 'foo', value: 'bar' },
            { name: 'bar', value: true },
            { name: 'baz', value: 3.14 },
          ]);
        })
        .then(done)
        .catch(done.fail);
    });

    it('does not modify environments defined as array', (done) => {
      const config = {
        containerDefinitions: [
          {
            environment: [1, 2, 3]
          }
        ]
      };

      envFromHashModifier.modify(config)
        .then((conf) => {
          expect(conf.containerDefinitions[0].environment).toEqual([1, 2, 3]);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('modify port mappings', () => {
    let portsFromStringModifier;

    beforeEach(() => {
      portsFromStringModifier = new PortMappingFromStringConfigModifier();
    });

    it('modifies portMappings defined as strings', (done) => {
      const config = {
        containerDefinitions: [
          {
            portMappings: ["80"]
          }
        ]
      };

      portsFromStringModifier.modify(config)
        .then((conf) => {
          expect(conf.containerDefinitions[0].portMappings).toEqual([
            { containerPort: 80, hostPort: 0 },
          ]);
        })
        .then(done)
        .catch(done.fail);
    });

    it('modifies portMappings defined as single number', (done) => {
      const config = {
        containerDefinitions: [
          {
            portMappings: [80]
          }
        ]
      };

      portsFromStringModifier.modify(config)
        .then((conf) => {
          expect(conf.containerDefinitions[0].portMappings).toEqual([
            { containerPort: 80, hostPort: 0 },
          ]);
        })
        .then(done)
        .catch(done.fail);
    });

    it('modifies portMappings defined as string with fixed host port', (done) => {
      const config = {
        containerDefinitions: [
          {
            portMappings: ["8080:80"]
          }
        ]
      };

      portsFromStringModifier.modify(config)
        .then((conf) => {
          expect(conf.containerDefinitions[0].portMappings).toEqual([
            { containerPort: 80, hostPort: 8080 },
          ]);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('decrypting secure values', () => {
    let decryptSecureValuesModifier;
    let kms;
    let kmsDecryptedValue;

    beforeEach(() => {
      kms                         = {
        decrypt: () => ({ promise: () => Promise.resolve({ Plaintext: new Buffer(kmsDecryptedValue) }) })
      };
      decryptSecureValuesModifier = new DecryptSecureValuesConfigModifier(kms);
    });

    it('decrypts plain objects with one single key named \'secure\'', (done) => {
      kmsDecryptedValue    = 'kms-decrypted';
      const encryptedValue = { secure: 'encrypted' };
      const json           = {
        'scalar': encryptedValue,
        'array': ['one', 'two', encryptedValue],
        'object': {
          'scalar': encryptedValue,
          'array': ['three', encryptedValue],
          'nested': {
            'scalar': encryptedValue
          }
        }
      };

      decryptSecureValuesModifier.modify(json)
        .then(config => {
          expect(config).toEqual(jasmine.objectContaining({
            'scalar': kmsDecryptedValue,
            'array': ['one', 'two', kmsDecryptedValue],
            'object': {
              'scalar': kmsDecryptedValue,
              'array': ['three', kmsDecryptedValue],
              'nested': {
                'scalar': kmsDecryptedValue
              }
            }
          }));
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
