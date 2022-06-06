/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  preset: 'ts-jest/presets/default-esm',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The test environment that will be used for testing
  testEnvironment: 'node',

  globals: {
    'ts-jest': {
      // Both of these seem to be needed for the tests to run as ES modules.
      useESM: true,
      babelConfig: true,
    },
  },

  // Allow importing with `.js` extension and map it to TypeScript in tests.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
