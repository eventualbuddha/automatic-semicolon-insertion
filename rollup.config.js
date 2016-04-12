import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import { readFileSync } from 'fs';

export default {
  entry: 'src/index.js',
  plugins: [
    babel(babelrc())
  ]
};
