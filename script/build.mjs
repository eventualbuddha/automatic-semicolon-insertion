// @ts-check

import ts from '@rollup/plugin-typescript';
import { rollup } from 'rollup';
import { createRequire } from 'module';
import { rm } from 'fs/promises';
import { join } from 'path';

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('../package.json');
const pkg = require('../package.json');

/**
 * @param {string} path
 */
async function rmrf(path) {
  try {
    await rm(path, { recursive: true });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

export async function build() {
  process.stdout.write('Building…');
  await rmrf(join(import.meta.url, 'build'));

  const requirePath = join(pkgPath, '..', pkg.exports['.'].require);
  const importPath = join(pkgPath, '..', pkg.exports['.'].import);

  const build = await rollup({
    input: 'src/index.ts',

    plugins: [
      // Allow processing of TypeScript files.
      ts({
        tsconfig: './tsconfig.json',
      }),
    ],

    // Do not bundle dependencies.
    external: [...Object.keys(pkg.dependencies || {}), 'assert'],
  });

  await build.write({
    file: requirePath,
    format: 'cjs',
  });

  await build.write({
    file: importPath,
    format: 'esm',
  });

  process.stdout.write(' ✅\n');
}
