<!-- markdownlint-disable-file MD041 -->
<div align="center">
  <h1>Gherkin PowerTools</h1>
  <img src="assets/logo.png" alt="Gherkin PowerTools Logo" width="250" /><br/><br/>

  <p><em>Advanced formatter, linter, and productivity suite for Gherkin <code>.feature</code> files in VS Code.</em></p>

  <p>
    <a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">
      <img src="https://img.shields.io/visual-studio-marketplace/i/carloscamara.vscode-gherkin-powertools?style=for-the-badge&logo=visualstudiocode&logoColor=white&label=Installs&color=blue" alt="Installs" />
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools#review-details">
      <img src="https://img.shields.io/visual-studio-marketplace/stars/carloscamara.vscode-gherkin-powertools?style=for-the-badge&logo=visualstudiocode&logoColor=white&color=yellow" alt="Rating" />
    </a>
    <img src="https://img.shields.io/badge/VS%20Code-%5E1.93.0-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="VS Code 1.93.0+" />
    <a href="./LICENSE">
      <img src="https://img.shields.io/github/license/carlos-camara/vscode-gherkin-powertools?style=for-the-badge&color=green" alt="License: MIT" />
    </a>
  </p>
</div>

---

Writing and maintaining Behavior-Driven Development (BDD) specifications often leads to chaotic, misaligned `.feature` files and unnoticed syntax errors. 

**Gherkin PowerTools** solves this by providing a zero-configuration, native VS Code extension that automatically formats your scenarios, catches syntax errors in real-time, and provides deep insights into your BDD project.

---

## 🚀 Main Benefits

- **Zero Configuration Formatter**: Instantly align tables, indent steps, and wrap long tags. Press `Shift+Alt+F` and let the extension handle the rest.
- **Real-Time Linter**: Catch missing colons, invalid structures, and misspelled keywords as you type, with intelligent **Quick Fixes** to auto-correct them.
- **Analytics Dashboard**: Visualize your project's health with the integrated Statistics Dashboard, highlighting scenario complexity, test execution ROI, and step distribution.
- **Seamless Navigation**: `Cmd/Ctrl+Click` on any step to instantly jump to its underlying Python implementation.

<div align="center">
  <img src="assets/formatter.webp" alt="Formatter Demonstration" width="49%" />
  <img src="assets/linter.webp" alt="Linter Demonstration" width="49%" />
</div>

---

## 📦 Installation

**Via VS Code Marketplace** *(recommended)*

1. Open VS Code → Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search **"Gherkin PowerTools"** and click **Install**

**Via CLI:**

```bash
code --install-extension carloscamara.vscode-gherkin-powertools
```

---

## 🎨 Formatter: Before & After

Gherkin PowerTools integrates directly with the VS Code formatting API.

**Before** (Chaotic, misaligned)
```gherkin
feature: user authentication
@smoke @regression @login @security
given i am on the login page
when i enter "admin" as username
and i enter "secret" as password
then i should be redirected to dashboard
  |field  |value |
  |user   |admin |
```

**After** (Clean, standardized)
```gherkin
Feature: User Authentication

    @login @regression @security
    @smoke
    Scenario: Successful login
        Given I am on the login page
        When  I enter "admin" as username
        And   I enter "secret" as password
        Then  I should be redirected to dashboard
              | field | value |
              | user  | admin |
```

> [!TIP]
> Enable **Format on Save** in your `.vscode/settings.json`:
> ```jsonc
> "[feature]": {
>   "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
>   "editor.formatOnSave": true
> }
> ```

---

## 🤝 Compatibility

Works seamlessly out-of-the-box with any Gherkin-based framework:
**Cucumber** · **Behave** · **SpecFlow** · **Karate** · **pytest-bdd**

*(Note: "Go To Definition" currently supports Python/Behave projects).*

---

## ⚖️ Gherkin PowerTools vs Official Cucumber Extension

While the [Official Cucumber Extension](https://marketplace.visualstudio.com/items?itemName=CucumberOpen.cucumber-official) is great for step auto-completion and general language support, **Gherkin PowerTools** focuses heavily on code quality, advanced formatting, and live diagnostics without requiring complex workspace configurations.

| Feature | Gherkin PowerTools | Official Cucumber Extension |
|---------|--------------------|-----------------------------|
| **Setup Required** | None (Works out of the box) | Requires `cucumber.features` & `cucumber.glue` globs |
| **Formatter** | Advanced (Configurable indents, dynamic tables, tag wrapping) | Basic (Strict 2-space, basic table alignment) |
| **Linter / Diagnostics** | Yes (Real-time typo & structure detection) | No |
| **Quick Fixes (Code Actions)** | Yes (Auto-correct typos, insert missing colons, close tables) | Limited (Generate undefined step only) |
| **Project Statistics Dashboard** | Yes (Visual HTML dashboard with project metrics) | No |
| **Go To Definition** | Python / Behave (0ms cache lookup) | Multiple Languages |

---

## ✨ Complete Feature List

- **Intelligent Formatter**: Auto-indentation, dynamic table alignment to the keyword, auto-casing, and tag wrapping at 80 characters.
- **Live Diagnostics Linter**: Real-time syntax error detection instantly mapped to VS Code diagnostics.
- **Smart Code Actions**: Auto-correct syntax errors, missing colons, misspelled keywords, and automatically close malformed data tables.
- **Go To Definition**: Instantly jump from `.feature` steps to their Python implementations.
- **Hover Documentation Preview**: Hover over steps to view their underlying Python function signature and Docstring.
- **Project Analytics Dashboard**: Comprehensive metrics for your BDD workspace (Total executable tests, behavioral archetypes, code density).
- **Intelligent Snippets**: Instant scaffolding for `Feature`, `Scenario`, `Scenario Outline`, and `Rule` blocks.
- **Output Channel Tracing**: Native VS Code "Gherkin PowerTools" output channel for transparent logging.
- **Syntax Highlighting**: Hand-tuned color palette tailored specifically for VS Code dark themes.

---

## ⚙️ Configuration

Fine-tune the extension via your VS Code `settings.json`:

| Setting | Default | Description |
|---------|:-------:|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent step lines. |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | Align pipe tables to the preceding step column. |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Blank lines between `Scenario` / `Rule` blocks. |
| `gherkinPowerTools.tags.format` | `"wrap"` | `"wrap"` splits long tags at 80 chars. `"singleLine"` keeps them on one line. |

---

## 📚 Official Documentation

Want to master the extension? Detailed guides, architecture overviews, and feature deep-dives are hosted on our dedicated documentation website.

<div align="center">
  <a href="https://carlos-camara.github.io/vscode-gherkin-powertools/">
    <img src="https://img.shields.io/badge/📖_Read_the_Official_Documentation-512BD4?style=for-the-badge" alt="Official Documentation" />
  </a>
</div>

---

## 🛠️ Contributing & Architecture

All contributions are highly welcome — bug reports, feature requests, documentation, or code. Read our detailed [CONTRIBUTING.md](./CONTRIBUTING.md) guide to get started.

**Quality Assurance & CI/CD**
The extension maintains strict quality standards:
- **Native UI E2E Tests** via `@vscode/test-electron`.
- **>92% Unit Test Coverage** across platforms (macOS, Linux, Windows).
- Instantaneous bundle via **esbuild** for 0ms activation times.

<p align="center">
  <a href="https://github.com/carlos-camara/vscode-gherkin-powertools/actions/workflows/test.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/carlos-camara/vscode-gherkin-powertools/test.yml?branch=main&style=for-the-badge&logo=mocha&logoColor=white&label=Unit%20Tests" alt="Unit Tests" />
  </a>
  <a href="https://github.com/carlos-camara/vscode-gherkin-powertools/actions/workflows/e2e.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/carlos-camara/vscode-gherkin-powertools/e2e.yml?branch=main&style=for-the-badge&logo=electron&logoColor=white&label=E2E%20Tests" alt="E2E Tests" />
  </a>
</p>

---

## 💖 Support & Sponsors

If this extension has saved you hours of formatting headaches or improved your team's BDD workflow, please consider supporting its ongoing development!

<br>
<div align="center">
  <a href="https://www.buymeacoffee.com/carloscamara">
    <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/sponsors/carlos-camara">
    <img src="https://img.shields.io/badge/Sponsor_on_GitHub-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="GitHub Sponsors" />
  </a>
</div>
<br>

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE) - © [Carlos Camara](https://github.com/carlos-camara).
