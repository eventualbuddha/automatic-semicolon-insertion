import { parse } from '@codemod/parser';
import { Insertion, process, Removal } from './index.js';

describe('insertions', () => {
  function check(source: string, expected: Array<Insertion>) {
    const ast = parse(source, { tokens: true });
    const { insertions } = process(source, ast);
    expect(expected).toEqual(insertions);
  }

  it('inserts a semicolon after expression statements', () =>
    check('foo', [
      {
        index: 3,
        content: ';',
      },
    ]));

  it('does not insert a semicolon after statements that have them', () =>
    check('foo;', []));

  it('does not insert semicolons after the init of a `for` loop', () =>
    check('for (var i = 0; i < 2; i++) {}', []));

  it('inserts semicolons after `return` statements', () =>
    check('function foo() { return 21 }', [
      {
        index: 26,
        content: ';',
      },
    ]));

  it('inserts semicolons after `throw` statements', () =>
    check('throw 1', [
      {
        index: 7,
        content: ';',
      },
    ]));

  it('inserts semicolons after `continue` statements', () =>
    check('for (;;) { continue }', [
      {
        index: 19,
        content: ';',
      },
    ]));

  it('inserts semicolons after `do-while` statements', () =>
    check('do {} while (true)', [
      {
        index: 18,
        content: ';',
      },
    ]));

  it('inserts semicolons after `break` statements', () =>
    check('for (;;) { break }', [
      {
        index: 16,
        content: ';',
      },
    ]));

  it('inserts semicolons after `debugger` statements', () =>
    check('debugger', [
      {
        index: 8,
        content: ';',
      },
    ]));

  it('inserts semicolons after `import` statements', () =>
    check('import "foo"', [
      {
        index: 12,
        content: ';',
      },
    ]));

  it('inserts semicolons after named `export` statements', () =>
    check('export { a }', [
      {
        index: 12,
        content: ';',
      },
    ]));

  it('inserts semicolons after `export` with a declaration statement', () =>
    check('export var a = 1', [
      {
        index: 16,
        content: ';',
      },
    ]));

  it('does not insert semicolons after `export` with a function declaration', () =>
    check('export function foo(){}', []));

  it('inserts semicolons after class expression export default statements', () =>
    check('export default class {}', [
      {
        index: 23,
        content: ';',
      },
    ]));

  it('handles nodes with children that are null', () => {
    check('[1, , 3]', [
      {
        index: 8,
        content: ';',
      },
    ]);
  });
});

describe('removals', () => {
  function check(source: string, expected: Array<Removal>) {
    const ast = parse(source, { sourceType: 'module', tokens: true });
    const { removals } = process(source, ast);
    expect(expected).toEqual(removals);
  }

  it('removes extra empty statements', () =>
    check('a;;', [
      {
        start: 2,
        end: 3,
      },
    ]));

  it('leaves empty statements in `for` loops', () => check('for (;;);', []));

  it('removes semicolons after method definitions', () =>
    check('class A { a() {}; }', [
      {
        start: 16,
        end: 17,
      },
    ]));

  it('removes semicolons after the start of a class body', () =>
    check('class A {; a() { b(); } }', [
      {
        start: 9,
        end: 10,
      },
    ]));
});
