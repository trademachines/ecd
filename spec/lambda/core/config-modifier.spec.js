'use strict';

const EnvironmentFromHashConfigModifier = require(
  './../../../src/lambda/core/config-modifier').EnvironmentFromHashConfigModifier;

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
            environment: [1,2,3]
          }
        ]
      };

      envFromHashModifier.modify(config).then(
        (conf) => {
          expect(conf.containerDefinitions[0].environment).toEqual([1,2,3]);
          done();
        },
        done.fail
      );
    });
  });
});
