import { Library } from 'ffi';
import * as _ from 'lodash';

const file = __dirname + '/../../_resources/libucl.so';

const bindings = new Library(file, {
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
export class LibuclParser {
  private parser;
  private vars: { [key: string]: string } = {};
  private varsCounter = 0;

  constructor() {
    this.parser = bindings.ucl_parser_new(0);
    this.checkError();
  }

  addVariable(key: string, value: string) {
    const tempVarName = _.padStart(++this.varsCounter, 10, '0');
    this.vars[key]    = tempVarName;
    bindings.ucl_parser_register_variable(this.parser, tempVarName, String(value));
    this.checkError();
  }

  addString(content: string) {
    const alternatives = _.chain(this.vars).keys().map((x) => `\\b${x}\\b`).join('|').value();
    const regex        = `\\$\\{(${alternatives})\\}`;
    content            = content.replace(new RegExp(regex, 'g'), (_m, p) => `\$\{${this.vars[p]}\}`);

    bindings.ucl_parser_add_chunk(this.parser, content, content.length);
    this.checkError();
  }

  asJson(): any {
    const uclObj = bindings.ucl_parser_get_object(this.parser);
    const json   = bindings.ucl_object_emit(uclObj, 0);

    this.checkError();

    return JSON.parse(json);
  }

  private checkError() {
    const err = bindings.ucl_parser_get_error(this.parser);

    if (err) {
      throw new Error(err);
    }
  }
}

export class LibuclFactory {
  create(): LibuclParser {
    return new LibuclParser();
  }
}
