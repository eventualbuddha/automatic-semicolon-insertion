# automatic-semicolon-insertion

Insert missing semicolons, remove unneeded ones.

## Install

```sh
$ npm install automatic-semicolon-insertion
```

## Usage

```js
import * as asi from 'automatic-semicolon-insertion';
import { parse } from '@codemod/parser';

const source = 'let a = class {}'; // should have a semicolon after it

console.log(asi.process(source, parse(source)));

/*
prints:

{ insertions: [ { index: 16, content: ';' } ], removals: [] }
*/
```
