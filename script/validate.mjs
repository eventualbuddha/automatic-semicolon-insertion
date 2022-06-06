// @ts-check

import { parse } from '@codemod/parser';
import { strict as assert } from 'assert';
import { readFile } from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * @type {Array<[string, import('../src/index').Changes]>}
 */
const EXAMPLES = [
  // simple insertion
  [
    `a`,
    {
      insertions: [{ index: 1, content: ';' }],
      removals: [],
    },
  ],
  // simple removal
  [
    `a;;`,
    {
      insertions: [],
      removals: [{ start: 2, end: 3 }],
    },
  ],
  // no-op
  [
    `class A {}`,
    {
      insertions: [],
      removals: [],
    },
  ],
];

/**
 * @param {import('../src')} asi
 * @param {string} code
 * @param {import('../src/index').Changes} expected
 */
function validateExample(asi, code, expected) {
  const ast = parse(code, { tokens: true });
  assert.deepEqual(asi.process(code, ast), expected);
}

/**
 * @param {import('../src')} asi
 */
function validateAsi(asi) {
  for (const [code, expected] of EXAMPLES) {
    validateExample(asi, code, expected);
  }
}

/**
 * Validates the CommonJS build, ensuring that `require`s work.
 */
export function validateCommonJSBuild() {
  process.stdout.write('Validating CommonJS build…');
  validateAsi(require('../'));
  process.stdout.write(' ✅\n');
}

/**
 * Validates the ESM build, ensuring that `import`s work.
 */
export async function validateEsmBuild() {
  process.stdout.write('Validating ESM build…');
  // @ts-ignore
  validateAsi(await import('automatic-semicolon-insertion'));
  process.stdout.write(' ✅\n');
}

/**
 * Validates the basics of the package type info.
 */
export async function validateTypes() {
  process.stdout.write('Validating types…');
  const pkg = require('../package.json');
  assert.equal(pkg.types, './build/index.d.ts');
  assert.equal(pkg.exports['.'].types, './build/index.d.ts');
  const ast = parse(await readFile('./build/index.d.ts', 'utf8'));
  const processFunctionExport = ast.program.body.find(
    (statement) =>
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration?.type === 'TSDeclareFunction' &&
      statement.declaration.id?.name === 'process'
  );
  assert.ok(
    processFunctionExport,
    'Expected to find export of process function'
  );
  process.stdout.write(' ✅\n');
}

/**
 * Validates the built package.
 */
export async function validate() {
  validateCommonJSBuild();
  await validateEsmBuild();
  await validateTypes();
}
