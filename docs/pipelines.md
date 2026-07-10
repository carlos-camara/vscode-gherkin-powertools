# ⚙️ CI/CD Pipelines Architecture

This repository uses **GitHub Actions** for Continuous Integration and Continuous Deployment (CI/CD). Our workflows ensure code quality, prevent regressions, maintain documentation integrity, and secure our dependencies.

Here is a detailed breakdown of all the active pipelines in this project:

## 1. 🧪 Test & Coverage (`test.yml`)
**Triggers:** Push to `main`, Pull Requests
- **Matrix Strategy:** Runs concurrently across three operating systems (`ubuntu-latest`, `macos-latest`, `windows-latest`) to ensure full cross-platform compatibility of the VS Code extension.
- **Node.js:** Compiles the TypeScript codebase using strict typing.
- **Coverage:** On Linux, it generates an LCOV coverage report using `xvfb` (virtual display for VS Code API testing) and automatically posts a coverage comment on the Pull Request.

## 2. 🛡️ Security Audit (`security-audit.yml`)
**Triggers:** Push to `main`, Pull Requests (on package changes), Daily Schedule (03:00 AM)
- **Vulnerability Scanning:** Runs `npm audit --audit-level=high`.
- **Purpose:** Acts as a strict gatekeeper. It immediately fails the build if a developer introduces a package with a known High or Critical vulnerability (CVE), preventing vulnerable code from reaching `main`.

## 3. 🛡️ Code Quality Lint (`lint.yml`)
**Triggers:** Push to `main`, Pull Requests
- **Codebase Linting:** Runs `carlos-camara/qa-hub-actions/lint-codebase`.
- **Scope:** It strictly lints Markdown files, YAML configurations, and GitHub Actions definitions to enforce consistency across the repository (e.g., ensuring no trailing spaces or misconfigured workflows).

## 4. 🔗 Link Checker (`link-checker.yml`)
**Triggers:** Push/PRs affecting `docs/` or `README.md`, Daily Schedule (02:00 AM)
- **Broken Link Detection:** Uses Lychee to recursively scan all Markdown files.
- **Purpose:** Ensures the documentation and README never contain 404 broken links or missing images, which is critical before publishing the extension.

## 5. 🏷️ PR Labeler (`labeler.yml`)
**Triggers:** `pull_request_target`
- **Semantic Labeling:** Analyzes the PR title and automatically assigns labels like `bug`, `enhancement`, or `documentation`.
- **Size Labeling:** Calculates the number of lines added/deleted in the PR and automatically assigns a size label (`size/S`, `size/M`, `size/L`, `size/XL`) to help maintainers prioritize code reviews.

## 6. 🚦 PR Hygiene Gate (`gate-check.yml`)
**Triggers:** Pull Requests
- **Hygiene Validator:** Ensures that the PR description meets a minimum length and quality, and that commits follow the Conventional Commits format.
- **AI Summarizer:** Leverages AI to provide a quick summary of the PR's impact for reviewers.

## 7. 🌐 Pages Deployment (`pages.yml`)
**Triggers:** Push to `main` (on `docs/` or `mkdocs.yml` changes)
- **MkDocs Compilation:** Builds the static documentation site using `mkdocs-material` (strictly pinned to avoid upstream breaking changes).
- **Deployment:** Automatically pushes the generated HTML site to GitHub Pages.

## 8. 📦 Release & Packaging (`release.yml`)
**Triggers:** Push to `main`
- **Version Detection:** Checks if the version in `package.json` has changed.
- **Tagging & Packaging:** If a new version is detected, it creates a new Git Tag, compiles the `.vsix` extension package using `@vscode/vsce`, and uploads it automatically to a new GitHub Release.

## 9. 🧑‍💻 Auto Assign PR (`auto-assign.yml`)
**Triggers:** Pull Request opened or ready for review
- **Auto-Assignment:** Automatically assigns the author of the PR as the assignee using the GitHub CLI, saving manual clicks and improving visibility.
