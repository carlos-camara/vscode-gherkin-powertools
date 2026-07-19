# Contributing to Gherkin PowerTools

Contributions to **Gherkin PowerTools** are welcome. This document explains the architecture, local project setup, and submission process.

---

## 🏗️ Architecture Overview

The extension is written in **TypeScript** and uses the native **VS Code Extension API**. It is built with performance and maintainability in mind.

Here is a breakdown of the core modules located in the `src/` directory:

- **`extension.ts`**: The entry point. Bundled via Esbuild for fast activation. Registers all commands, providers, and diagnostics.
- **`formatter.ts`**: The core AST-based formatter. It handles indentation, table alignment, auto-casing, and tag wrapping based on `@cucumber/gherkin` parses.
- **`highlighter.ts`**: Implements custom semantic syntax highlighting via VS Code's `createTextEditorDecorationType` API.
- **`linter.ts`**: Uses the official `@cucumber/gherkin` AST parser to perform real-time syntax checking. Generates `vscode.Diagnostic` warnings to underline mistakes in the editor.
- **`definition.ts`**: The Go-To-Definition provider. Accesses `cache.ts` for instant lookups.
- **`outline.ts`**: Constructs the hierarchical tree of `Feature > Rule > Scenario` for the VS Code Outline panel.
- **`statistics.ts`**: Generates the interactive HTML Webview dashboard by parsing workspace files to count BDD metrics.
- **`codeAction.ts`**: Generates quick fixes (💡) for undefined steps or syntax typos.
- **`completion.ts`**: Smart IntelliSense autocompletion parsing regex into Snippets.
- **`cache.ts`**: Asynchronous caching engine that non-blockingly indexes the workspace via `vscode.workspace.findFiles`.
- **`logger.ts`**: Native VS Code Output Channel for tracing.
- **`hover.ts`**: Provides hover information such as function signatures, docstrings, and tag blast radius.
- **`parser.ts`**: Handles AST parsing and caching of Gherkin documents.
- **`dialect.ts`**: Provides i18n support by matching localized Gherkin keywords.
- **`discovery.ts`**: Centralized service for Behave step-file discovery, configuration normalization, and reactive file watchers.

---

## 🛠️ Local Setup

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) (v22+) and [npm](https://www.npmjs.com/) installed.
2. **Clone the repository**:
   ```bash
   git clone https://github.com/carlos-camara/vscode-gherkin-powertools.git
   cd vscode-gherkin-powertools
   ```
3. **Install dependencies**:
   ```bash
   npm ci
   ```
4. **Compile the TypeScript code**:
   ```bash
   npm run compile
   ```
5. **Run the Extension**:
   - Press `F5` in VS Code to open a new "Extension Development Host" window.
   - Any changes you make to the code can be tested by reloading the Development Host (`Cmd + R` / `Ctrl + R`).

---

## 🧪 Testing

The official `@vscode/test-electron` framework coupled with Mocha is used to run tests. Tests are split into two categories to maximize efficiency and reliability:

### Unit Tests
To run ultra-fast unit tests that validate the AST processor and algorithms:
```bash
npm run test
```

To run the unit tests and generate an LCOV coverage report:
```bash
npm run coverage
```

### End-to-End (E2E) UI Tests
To run native UI integration tests that launch a real VS Code instance and test features like formatting, outline generation, and linting directly via the VS Code Extension APIs:
```bash
npm run test:e2e
```

> **Important:** Always ensure that all tests pass before submitting a Pull Request. If you are adding a new feature, please add a corresponding test case in the `src/test/` directory.

---

## 🤖 CI/CD Pipeline

The CI/CD pipeline leverages reusable GitHub Actions from the [qa-hub-actions](https://github.com/carlos-camara/qa-hub-actions) repository. This ensures consistency across quality checks. Specifically, coverage reporting and other QA gates are handled externally by these actions.

---

## 📦 Packaging

To create a local `.vsix` file for distribution or local testing:

```bash
npx vsce package
```

This will generate a `vscode-gherkin-powertools-x.x.x.vsix` file in the root directory.

---

## 🤝 Submitting a Pull Request

<br>

**ℹ️ NOTE:** *If you are planning a large feature or significant architectural change, please open an Issue or Discussion first to align with the project maintainers before writing code. Please use our structured Issue Forms to report bugs, performance problems, or feature requests before starting.*

<br>

1. Fork the repository.
2. Create a new branch for your feature or bug fix: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Open a Pull Request against the `main` branch.

Code reviews will be conducted on all submissions.
