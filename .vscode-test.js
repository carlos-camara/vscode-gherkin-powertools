const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig([
  {
    label: 'unitTests',
    files: 'out/test/suite/**/*.test.js',
    version: '1.93.0',
    workspaceFolder: './',
    mocha: {
      ui: 'tdd',
      timeout: 20000
    }
  },
  {
    label: 'e2eTests',
    files: 'out/test/e2e/**/*.test.js',
    version: '1.93.0',
    workspaceFolder: './',
    mocha: {
      ui: 'tdd',
      timeout: 20000
    }
  }
]);
