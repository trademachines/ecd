'use strict';

const ffi  = require('ffi');
const file = __dirname + '/resources/libucl.so';

const bindings = new ffi.Library(file, {
  'ucl_parser_new': ['pointer', ['int']],
  'ucl_parser_register_variable': ['void', ['pointer', 'string', 'string']],
  'ucl_parser_add_chunk': ['bool', ['pointer', 'string', 'int']],
  'ucl_parser_get_object': ['pointer', ['pointer']],
  'ucl_object_emit': ['string', ['pointer', 'int']],
  'ucl_parser_get_error': ['string', ['pointer']],
});

/**
 *
 */
class LibuclParser {
  /**
   */
  constructor() {
    this.parser = bindings.ucl_parser_new(0);
    this._checkError();
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  addVariable(key, value) {
    bindings.ucl_parser_register_variable(this.parser, key, String(value));
    this._checkError();
  }

  /**
   * @param {string} content
   */
  addString(content) {
    bindings.ucl_parser_add_chunk(this.parser, content, content.length);
    this._checkError();
  }

  /**
   * @return {object}
   */
  asJson() {
    const uclObj = bindings.ucl_parser_get_object(this.parser);
    const json   = bindings.ucl_object_emit(uclObj, 0);

    this._checkError();

    return JSON.parse(json);
  }

  /**
   * @private
   */
  _checkError() {
    const err = bindings.ucl_parser_get_error(this.parser);

    if (err) {
      throw new Error(err);
    }
  }
}

module.exports.LibuclFactory = class {
  /**
   */
  constructor() {
  }

  /**
   * @return {LibuclParser}
   */
  create() {
    return new LibuclParser();
  }
};

module.exports.LibuclParser = LibuclParser;
