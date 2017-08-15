import { expect } from 'chai';
import { defineSupportCode } from 'cucumber';
import * as _ from 'lodash';
import { CustomWorld } from '../support/world';

// use(require('./../support/chai-like'));

defineSupportCode(({ Then }) => {
  Then(`the response should be ok`, function (this: CustomWorld) {
    expect(this.lastResponseOk).to.equal(true);
  });

  Then(`the response should not be ok`, function (this: CustomWorld) {
    expect(this.lastResponseOk).to.equal(false);
  });

  Then(`dump response`, function (this: CustomWorld) {
    console.log(JSON.stringify(this.lastResponse), null, 2);
  });

  Then(/^the response property (.+) equals (.+)$/, function (this: CustomWorld, path: string, expected: number) {
    let value = _.get(this.lastResponse, path);

    expect(value).to.equal(expected);
  });
});
