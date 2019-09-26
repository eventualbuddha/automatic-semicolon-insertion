# automatic-semicolon-insertion

Insert missing semicolons, remove unneeded ones.

## Install

```sh
$ yarn add automatic-semicolon-insertion
# or via npm
$ npm install automatic-semicolon-insertion
```

## Usage

```js
import asi from "automatic-semicolon-insertion";
import { parse } from "@codemod/parser";

const source = "let a = class {}"; // should have a semicolon after it

console.log(asi(source, parse(source)));

/*
prints:

{ insertions: [ { index: 16, content: ';' } ], removals: [] }
*/
```
