const LibuclParser = require('./../../../src/lambda/core/libucl').LibuclParser;

describe('Licucl parser', () => {
  let libuclParser;

  beforeEach(() => {
    libuclParser = new LibuclParser();
  });

  it('replaces overlapping vars correctly', () => {
    libuclParser.addVariable('QUEUE', 'one');
    libuclParser.addVariable('QUEUE_1', 'two');

    libuclParser.addString("key = ${QUEUE}\nanother = ${QUEUE_1}");

    expect(libuclParser.asJson()).toEqual({key:'one', another: 'two'});
  });
});
