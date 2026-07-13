# ⚙️ CI/CD Pipelines Architecture

This repository uses **GitHub Actions** for Continuous Integration and Continuous Deployment (CI/CD). Our workflows ensure code quality, prevent regressions, maintain documentation integrity, and secure our dependencies.

Here is a detailed breakdown of all the active pipelines in this project:

## 1. 🧪 Unit Test & Coverage (`test.yml`)
**Triggers:** Push to `main`, Pull Requests
- **Matrix Strategy:** Runs concurrently across three operating systems (`ubuntu-latest`, `macos-latest`, `windows-latest`) to ensure full cross-platform compatibility of the VS Code extension.
- **Node.js:** Compiles the TypeScript codebase using strict typing.
- **Reporting & Coverage:** On Linux, it generates an LCOV coverage report and a JUnit XML test report. It uses GitHub Actions to automatically post formatted PR comments with test execution results and coverage data.

## 2. 🎭 End-to-End (E2E) UI Tests (`e2e.yml`)
**Triggers:** Push to `main`, Pull Requests
- **VS Code Bootstrapping:** Uses `@vscode/test-electron` to download, install, and execute a real VS Code instance within a virtual Linux framebuffer (`xvfb`).
- **Simulated GUI Workflows:** Validates core extension functionalities by acting exactly as a user would:
  - Opening documents and dynamically assigning them the `feature` language ID.
  - Automatically injecting faulty or unformatted Gherkin texts.
  - Using `vscode.commands.executeCommand('editor.action.formatDocument')` to invoke the native formatter.
  - Querying native `vscode.executeDocumentSymbolProvider` commands to assert the Outline tree generates correctly.
  - Asserting the `Linter` creates real-time `Diagnostic` instances in response to active text modifications.
- **Reporting:** Automatically generates JUnit XML test results and posts a formatted summary as a Pull Request comment.

## 3. 🛡️ Code Quality Lint (`lint.yml`)
**Triggers:** Push to `main`, Pull Requests
- **Codebase Linting:** Runs `carlos-camara/qa-hub-actions/lint-codebase`.
- **Scope:** It strictly lints Markdown files, YAML configurations, and GitHub Actions definitions to enforce consistency across the repository.

## 4. 🏷️ PR Labeler (`labeler.yml`)
**Triggers:** `pull_request`
- **Semantic Labeling:** Analyzes the PR title and automatically assigns labels like `bug`, `enhancement`, or `documentation`.
- **Size Labeling:** Calculates the number of lines added/deleted in the PR and automatically assigns a size label (`size/S`, `size/M`, `size/L`, `size/XL`) to help maintainers prioritize code reviews.

## 5. 🌐 Pages Deployment (`pages.yml`)
**Triggers:** Push to `main` (on `docs/` or `mkdocs.yml` changes)
- **MkDocs Compilation:** Builds the static documentation site using `mkdocs-material` (pinned to avoid upstream breaking changes).
- **Deployment:** Automatically pushes the generated HTML site to GitHub Pages.

## 6. 📦 Release & Packaging (`release.yml`)
**Triggers:** Push to `main`
- **Version Detection:** Checks if the version in `package.json` has changed.
- **Tagging & Packaging:** If a new version is detected, it compiles the `.vsix` extension package using `@vscode/vsce`, and uploads it automatically to a new GitHub Release.
