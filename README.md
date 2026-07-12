<!-- markdownlint-disable-file MD041 -->
<div align="center">
  <h1>Gherkin PowerTools</h1>
  <img src="assets/logo.png" alt="Gherkin PowerTools Logo" width="250" /><br/><br/>

  <p><em>Format, lint and navigate Gherkin <code>.feature</code> files in VS Code.</em></p>

  <p>
    <a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">
      <img src="https://img.shields.io/visual-studio-marketplace/i/carloscamara.vscode-gherkin-powertools?style=for-the-badge&logo=visualstudiocode&logoColor=white&label=Installs&color=blue" alt="Installs" />
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools#review-details">
      <img src="https://img.shields.io/visual-studio-marketplace/stars/carloscamara.vscode-gherkin-powertools?style=for-the-badge&logo=visualstudiocode&logoColor=white&color=yellow" alt="Rating" />
    </a>
    <img src="https://img.shields.io/badge/VS%20Code-%5E1.93.0-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="VS Code 1.93.0+" />
  </p>

  <p><strong><a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">Install from VS Code Marketplace</a></strong></p>
</div>

---

<div align="center">
  <img src="assets/formatter.webp" alt="Formatter Demonstration" width="49%" />
  <img src="assets/linter.webp" alt="Linter Demonstration" width="49%" />
</div>

---

## Why Gherkin PowerTools?

The advanced Gherkin formatter and linter for VS Code, with deeper tooling for Python/Behave projects. 

Writing Behavior-Driven Development (BDD) specifications often results in misaligned tables, inconsistent indentation, and syntax typos that are only caught during test execution. **Gherkin PowerTools** runs natively in VS Code to format your files, detect structural errors in real-time, and provide navigation capabilities directly to your code.

---

## 🎨 Before / After

The formatter parses the Abstract Syntax Tree (AST) to ensure correct casing, indentation, and alignment.

**Before**
```gherkin
feature: user authentication

@smoke @regression
scenario: successful login
given i am on the login page
when i enter "admin" as username
and i enter "secret" as password
then i should be redirected to dashboard
  |field  |value |
  |user   |admin |
```

**After**
```gherkin
Feature: User Authentication

    @smoke @regression
    Scenario: Successful login
        Given I am on the login page
        When  I enter "admin" as username
        And   I enter "secret" as password
        Then  I should be redirected to dashboard
              | field | value |
              | user  | admin |
```

---

## 🤝 Compatibility

The extension splits its functionality into two tiers to optimize performance:

### Generic `.feature` files (Any Framework)
Works immediately on any `.feature` file regardless of the underlying test runner (Cucumber, SpecFlow, Karate, Cypress, etc.).
- Formatter
- Linter
- Quick Fixes
- Workspace Statistics Dashboard
- Syntax Highlighting

### Python / Behave Specific
When working in a Python/Behave project, the extension automatically parses your `@given`, `@when`, and `@then` decorators to enable code-level features:
- Go To Definition (`Cmd/Ctrl+Click`)
- Autocomplete (Step suggestions based on Python definitions)
- Hover (Displays the Python Docstring of the step)

---

## ⚖️ Gherkin PowerTools vs Official Cucumber Extension

This extension is designed to address formatting and linting workflows, whereas the [Official Cucumber Extension](https://marketplace.visualstudio.com/items?itemName=CucumberOpen.cucumber-official) provides broader language support for code generation.

| Feature | Gherkin PowerTools | Official Cucumber Extension |
|---------|--------------------|-----------------------------|
| **Setup** | Does not require workspace configuration. | Requires `cucumber.features` & `cucumber.glue` globs in settings. |
| **Formatter** | Configurable step indentation, dynamic table alignment relative to keyword, tag wrapping limit. | 2-space indentation, internal table cell alignment. |
| **Linter / Diagnostics** | Flags syntax errors, missing colons, and structural warnings in real-time. | Does not provide syntax linting. |
| **Code Actions** | Auto-corrects typos, inserts missing colons, closes data tables. | Generates undefined step snippets. |
| **Navigation** | Parses Behave/Python decorators. | Parses multiple languages (Java, Ruby, JS, SpecFlow, etc.). |

---

## ✨ Features

### 1. Formatter
Auto-indentation, dynamic data table alignment to the preceding step keyword, auto-casing for Gherkin keywords (`given` -> `Given`), and configurable tag wrapping.

### 2. Live Diagnostics Linter
Real-time syntax error detection. It flags missing colons after block keywords, invalid structural nesting (e.g., `Examples` without `Scenario Outline`), and unclosed data tables.

### 3. Quick Fixes (Code Actions)
Press `Cmd+.` / `Ctrl+.` over a diagnostic warning to apply auto-corrections:
- Suggests corrections for misspelled keywords based on Levenshtein distance.
- Automatically appends missing colons.
- Converts `Scenario` to `Scenario Outline` when an `Examples` table is added.
- Closes malformed data table rows.

### 4. Behave Navigation (Go To Definition)
`Cmd+Click` (macOS) or `Ctrl+Click` (Windows/Linux) on any step to jump directly to its Python `@given`, `@when`, or `@then` implementation.

### 5. Autocomplete
Provides intelligent suggestions for steps as you type, directly sourced from your Python step definitions. Converts Behave placeholders into VS Code tab-stops.

### 6. Hover
Hover your cursor over any step in the `.feature` file to view the underlying Python function signature and its associated Docstring.

### 7. Dashboard
An integrated HTML Webview displaying project metrics, including a Gherkin Quality Score (GQS), file complexity warnings, and tag distribution.

### 8. Workspace Analytics
Tracks the total number of executable permutations (factoring in `Scenario Outline` rows) and calculates an estimated ROI based on automation time versus manual execution.

---

## ⚙️ Configuration

Available via your VS Code `settings.json`:

| Setting | Default | Description |
|---------|:-------:|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent step lines. |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | Align pipe tables dynamically to the start of the step text. |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Enforced blank lines between `Scenario` / `Rule` blocks. |
| `gherkinPowerTools.tags.format` | `"wrap"` | `"wrap"` splits long tags at 80 chars. `"singleLine"` disables wrapping. |

> **Format on Save**:
> ```jsonc
> "[feature]": {
>   "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
>   "editor.formatOnSave": true
> }
> ```

---

## 📚 Documentation

For architecture overviews and feature deep-dives, see the [Documentation Website](https://carlos-camara.github.io/vscode-gherkin-powertools/).

---

## 🛠️ Contributing

Bug reports, feature requests, and code contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

<p>
  <a href="https://github.com/carlos-camara/vscode-gherkin-powertools/actions/workflows/test.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/carlos-camara/vscode-gherkin-powertools/test.yml?branch=main&style=for-the-badge&logo=mocha&logoColor=white&label=Unit%20Tests" alt="Unit Tests" />
  </a>
  <a href="https://github.com/carlos-camara/vscode-gherkin-powertools/actions/workflows/e2e.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/carlos-camara/vscode-gherkin-powertools/e2e.yml?branch=main&style=for-the-badge&logo=electron&logoColor=white&label=E2E%20Tests" alt="E2E Tests" />
  </a>
</p>

---

## 📄 License

Licensed under the [MIT License](./LICENSE) - © [Carlos Camara](https://github.com/carlos-camara).
