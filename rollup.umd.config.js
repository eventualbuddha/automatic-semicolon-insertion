import config from './rollup.config.js';

config.dest = 'dist/automatic-semicolon-insertion.js';
config.format = 'umd';
config.moduleName = 'ASI';

export default config;
