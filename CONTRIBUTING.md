# Contributing to Gherkin Beautifier

First off, thank you for considering contributing to Gherkin Beautifier!

## Development Setup

1. Fork and clone the repository.
2. Run `npm install` to install dependencies.
3. Open the folder in VS Code.
4. Press `F5` to open the Extension Development Host window.

## Running Tests

Run `npm test` in the terminal to execute the Mocha test suite. Ensure all tests pass before submitting a Pull Request.

## Building from Source (VSIX)

If you want to package the extension locally into a `.vsix` file for manual distribution or testing:

1. Ensure all dependencies are installed (`npm install`).
2. Run the VS Code Extension CLI packaging command:
   ```bash
   npx @vscode/vsce package
   ```
3. A file named `vscode-gherkin-beautifier-x.x.x.vsix` will be generated in your root directory.

## Pull Request Process

1. Create a feature branch (`git checkout -b feature/amazing-feature`).
2. Commit your changes (`git commit -m 'feat: Add amazing feature'`).
3. Push to the branch (`git push origin feature/amazing-feature`).
4. Open a Pull Request.
