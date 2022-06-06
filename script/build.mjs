// @ts-check

import ts from '@rollup/plugin-typescript';
import { rollup } from 'rollup';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export async function build() {
  process.stdout.write('Building…');
  await rollup({
    input: 'src/index.ts',

    output: [
      // Build for CommonJS.
      {
        file: pkg.exports['.'].require,
        format: 'cjs',
      },
      // Build for ESM.
      {
        file: pkg.exports['.'].import,
        format: 'esm',
      },
    ],

    plugins: [
      // Allow processing of TypeScript files.
      ts({
        tsconfig: './tsconfig.json',
      }),
    ],

    // Do not bundle dependencies.
    external: [...Object.keys(pkg.dependencies || {}), 'assert'],
  });
  process.stdout.write(' ✅\n');
}
