import { RunConfiguration } from '../../../src/lambda/core/run-configuration';

describe('Run configuration', () => {
  it('filters out empty values', () => {
    let config = new RunConfiguration({ foo: null });

    expect(config.foo).toBeUndefined();
  });

  it('turns keys into camel case notation', () => {
    let config = new RunConfiguration({ FOO_BAR: 'baz' });

    expect(config.fooBar).toEqual('baz');
  });

  it('overwrites default config with provided one', () => {
    let config = new RunConfiguration({ bucket: 'some-bucket' });

    expect(config.bucket).toEqual('some-bucket');
  });
});
