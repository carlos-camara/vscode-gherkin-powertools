<!-- markdownlint-disable MD041 MD033 -->

<div align="center">

<img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/logo-transparent.png" alt="Gherkin PowerTools logo" width="120" /><br/>

# Gherkin PowerTools

**Write cleaner Gherkin. Catch errors earlier. Navigate Behave steps instantly.**

AST-powered formatting, validation, navigation and analytics for Gherkin projects, with first-class Python/Behave support.

<br/>

[![Install from Marketplace](https://img.shields.io/badge/VS%20Code%20Marketplace-Install-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![Version](https://vsmarketplacebadges.dev/version-short/carloscamara.vscode-gherkin-powertools.svg?style=flat-square&color=007ACC)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![Installs](https://vsmarketplacebadges.dev/installs-short/carloscamara.vscode-gherkin-powertools.svg?style=flat-square&color=28A745)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/carloscamara.vscode-gherkin-powertools.svg?style=flat-square&color=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.93-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/LICENSE)

</div>

---

**Jump to:** [Features](#features) · [Demos](#demo-gallery) · [Compatibility](#compatibility) · [Quick Start](#quick-start) · [Configuration](#configuration) · [Roadmap](#roadmap) · [Contributing](#contributing)

---

## Primary Demo

<div align="center">

![Formatter demo — tables, tags and indentation aligned in one keystroke](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif)

*Format Document <kbd>⇧⌥F</kbd> — tables, tags and indentation aligned in one keystroke*

</div>

---

## Features

Gherkin PowerTools is organized around four capabilities. Some work with any `.feature` file; others require a Python/Behave workspace. See the [Compatibility matrix](#compatibility) for details.

<br/>

<table>
<tr>
<td width="25%" valign="top">

### Format

Automatically align data table pipes to the step keyword, wrap long tag lists, enforce consistent indentation, and normalize empty lines between blocks.

Works with any `.feature` file.

[→ Formatter docs](https://carlos-camara.github.io/vscode-gherkin-powertools/features/formatter.html)

</td>
<td width="25%" valign="top">

### Validate

Real-time AST diagnostics flag malformed tables, missing colons, wrong keywords, and ambiguous step patterns as you type. One-click Quick Fixes correct the most common errors automatically.

Works with any `.feature` file.

[→ Linter docs](https://carlos-camara.github.io/vscode-gherkin-powertools/features/linter.html)

</td>
<td width="25%" valign="top">

### Navigate

Cmd-click any Gherkin step to jump to the Python function that implements it. IntelliSense suggests steps from your codebase filtered by keyword context. Hover shows the function signature and docstring inline.

Requires Python/Behave.

[→ Navigation docs](https://carlos-camara.github.io/vscode-gherkin-powertools/features/definition.html)

</td>
<td width="25%" valign="top">

### Analyze

The Project Statistics dashboard counts features, scenarios, steps, tags, and data tables across the entire workspace using the Cucumber AST. Includes a Gherkin Quality Indicator and estimated execution effort.

Works with any `.feature` file.

[→ Statistics docs](https://carlos-camara.github.io/vscode-gherkin-powertools/features/statistics.html)

</td>
</tr>
</table>

---

## Compatibility

| Capability | Any `.feature` file | Python / Behave | Notes |
|-----------|:-------------------:|:---------------:|-------|
| Table and tag formatting | ✅ | ✅ | Cucumber, Playwright BDD, SpecFlow, Karate |
| Step indentation | ✅ | ✅ | |
| Range formatting | ✅ | ✅ | Select text, then format |
| Multi-language keywords | ✅ | ✅ | 70+ dialects via Cucumber dialect database |
| Real-time AST diagnostics | ✅ | ✅ | |
| Keyword Quick Fixes | ✅ | ✅ | |
| Undefined step detection | — | ✅ | Requires step file indexing |
| Generate step definition | — | ✅ | Writes `.py` stub |
| Go to Definition | — | ✅ | `@given`, `@when`, `@then`, `@step` decorators |
| Step IntelliSense | — | ✅ | Context-aware by keyword |
| Scenario Outline param completion | — | ✅ | |
| Hover: function signature | — | ✅ | |
| Tag blast radius | ✅ | ✅ | Counts across workspace |
| Outline panel | ✅ | ✅ | |
| Project statistics | ✅ | ✅ | |
| Syntax highlighting | ✅ | ✅ | |
| Built-in snippets | ✅ | ✅ | `feature`, `scenario`, `outline`, `rule` |

<br>

<table>
  <tr>
    <td width="30" align="center" valign="top">ℹ️</td>
    <td>
      <strong>NOTE</strong><br>
      Formatting and linting work for Cucumber.js, Playwright BDD, SpecFlow, and Karate because they share the Gherkin syntax. These frameworks do not have framework-specific step navigation in this extension.
      <br><br>
      Python step definitions using complex regular expressions unsupported by the Node.js V8 engine (like negative lookbehinds) will still be parsed and available for autocomplete, but will not be matched dynamically for Hover or Linting.
    </td>
  </tr>
</table>

<br>
---

## Featured Demos

### Formatter — tables, tags, indentation

**Problem:** Misaligned pipes create noisy diffs and slow down code review.

**Result:** Format Document rewrites the file using the official `@cucumber/gherkin` AST. Tables snap to the step keyword, tags wrap at 80 characters, and indentation is normalized. Formatting is idempotent — a second pass produces zero edits.

<div align="center">

![Formatter — aligns tables, wraps tags, enforces indentation](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif)

<kbd>⇧</kbd><kbd>⌥</kbd><kbd>F</kbd> macOS &ensp;·&ensp; <kbd>Shift</kbd><kbd>Alt</kbd><kbd>F</kbd> Windows/Linux &ensp;·&ensp; <kbd>⌘K</kbd><kbd>⌘F</kbd> range

</div>

<sub>📖 [Formatter documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/formatter.html)</sub>

---

### Linter — real-time diagnostics and Quick Fixes

**Problem:** A missing colon or misspelled keyword silently reaches CI and fails the pipeline.

**Result:** The AST linter flags structural errors as you type. Quick Fixes correct the most common mistakes in one keypress.

<div align="center">

![Linter — real-time error detection](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/linter.gif)

<kbd>⌘</kbd><kbd>.</kbd> macOS &ensp;·&ensp; <kbd>Ctrl</kbd><kbd>.</kbd> Windows/Linux — Quick Fix on any underlined error

</div>

<sub>📖 [Linter documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/linter.html)</sub>

---

### Python/Behave navigation

**Problem:** In a large Behave project, finding the Python function behind a step means searching across multiple files.

**Result:** Cmd-click any step to jump directly to the decorator. IntelliSense filters suggestions by keyword context. Regex capture groups become interactive tab stops.

<div align="center">

![Go to Definition — Cmd-click a step, land on the Python decorator](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/goto-definition.gif)

<kbd>⌘</kbd><kbd>Click</kbd> macOS &ensp;·&ensp; <kbd>Ctrl</kbd><kbd>Click</kbd> Windows/Linux &ensp;·&ensp; <kbd>F12</kbd>

</div>

<sub>📖 [Go to Definition](https://carlos-camara.github.io/vscode-gherkin-powertools/features/definition.html) · [IntelliSense](https://carlos-camara.github.io/vscode-gherkin-powertools/features/snippets.html) · [Hover](https://carlos-camara.github.io/vscode-gherkin-powertools/features/hover.html)</sub>

---

### Project Statistics dashboard

**Problem:** It is difficult to understand the size, health, and complexity of a BDD test suite at a glance.

**Result:** The Statistics dashboard parses the entire workspace and displays a visual summary: features, rules, scenarios, outlines, executable steps, tag distribution, and a Gherkin Quality Indicator.

<div align="center">

![Project Statistics — workspace metrics from the Cucumber AST](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/dashboard.gif)

Command palette: `Gherkin: Show Project Statistics` · or right-click inside any `.feature` file

</div>

<sub>📖 [Statistics documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/statistics.html)</sub>

---

## Demo Gallery

<details>
<summary><b>Formatting demos</b></summary>

<br/>

**Table and tag alignment**

![Formatter — full document alignment](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif)

<kbd>⇧⌥F</kbd> / <kbd>Shift+Alt+F</kbd> — Format Document

</details>

<details>
<summary><b>Validation and Quick Fix demos</b></summary>

<br/>

**Real-time AST diagnostics**

![Linter — flags structural errors as you type](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/linter.gif)

**Keyword and punctuation Quick Fixes**

![Quick Fix — correct keyword typos with one keypress](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/auto-corrections.gif)

<kbd>⌘.</kbd> / <kbd>Ctrl.</kbd> — Quick Fix on any underlined error

</details>

<details>
<summary><b>Python/Behave navigation demos</b></summary>

<br/>

**Go to Definition**

![Go to Definition — jump from Gherkin step to Python decorator](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/goto-definition.gif)

**Step IntelliSense**

![IntelliSense — type-ahead suggestions from your Python step library](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/completion.gif)

**Hover — step signature and docstring**

![Hover on a step — shows the Python function signature and docstring](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/hover-step.gif)

**Hover — tag blast radius**

![Hover on a tag — shows the number of scenarios it affects across the workspace](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/hover-tags.gif)

**Generate empty step definition**

![Quick Fix — generate a Python stub for an undefined step](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/create-step.gif)

**Scenario Outline parameter completion**

![IntelliSense — type < to get column headers from the Examples table](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/outline-completion.gif)

</details>

<details>
<summary><b>Structure and analytics demos</b></summary>

<br/>

**Outline panel — semantic tree navigation**

![Outline — Feature, Rule, Scenario tree in the VS Code sidebar](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/outline.gif)

**Project Statistics dashboard**

![Statistics dashboard — workspace metrics generated from the Cucumber AST](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/dashboard.gif)

**Syntax highlighting**

![Syntax highlighting — semantic coloring for Gherkin keywords](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/highlighting.gif)

</details>

<details>
<summary><b>Installation demos</b></summary>

<br/>

**Install from Marketplace**

![Install from the VS Code Marketplace extension panel](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/install.gif)

**Install from a VSIX file**

![Install from a downloaded VSIX file](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/install-vsix.gif)

</details>

---

## Compared to Cucumber Official

Both extensions can be installed together. They serve different purposes.

| Capability | Gherkin PowerTools | Official Cucumber |
|-----------|:-----------------:|:-----------------:|
| Table alignment | ✅ Dynamic to step keyword | ✅ Basic |
| Tag wrapping | ✅ | — |
| Real-time structural linting | ✅ AST-based | ✅ Syntax + undefined steps |
| Keyword Quick Fixes | ✅ | — |
| Ambiguous step detection | ✅ | — |
| Python/Behave Go to Definition | ✅ | — |
| Language Server (LSP) | — | ✅ (all frameworks) |
| Cucumber.js navigation | — | ✅ |
| Project statistics | ✅ | — |

*Last reviewed: 2026-07-17. The Official Cucumber extension is maintained at [github.com/cucumber/vscode](https://github.com/cucumber/vscode).*

<br>

<table>
  <tr>
    <td width="30" align="center" valign="top">💡</td>
    <td>
      <strong>PRO-TIP</strong><br>
      Install both extensions. Gherkin PowerTools handles formatting, Python/Behave navigation, and analytics. The Official Cucumber extension provides Language Server Protocol support for other frameworks.
    </td>
  </tr>
</table>

<br>

---

## Quick Start

1. Install **Gherkin PowerTools** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools).
2. Open any `.feature` file.
3. Formatting and linting are active immediately with no configuration.

For Python/Behave navigation, ensure your step files match the default glob patterns (`**/steps/**/*.py`, `**/features/steps/**/*.py`) or update `gherkinPowerTools.behave.stepGlobs` in your workspace settings.

### Keyboard shortcuts

| Action | macOS | Windows / Linux |
|--------|-------|-----------------|
| Format Document | <kbd>⇧⌥F</kbd> | <kbd>Shift+Alt+F</kbd> |
| Format Selection | <kbd>⌘K ⌘F</kbd> | <kbd>Ctrl+K Ctrl+F</kbd> |
| Quick Fix | <kbd>⌘.</kbd> | <kbd>Ctrl+.</kbd> |
| Go to Definition | <kbd>⌘Click</kbd> | <kbd>Ctrl+Click</kbd> / <kbd>F12</kbd> |
| Trigger IntelliSense | <kbd>⌃Space</kbd> | <kbd>Ctrl+Space</kbd> |

---

## Configuration

Most features work without any configuration. The settings below are the ones most likely to need adjustment.

**Enable Format on Save:**

```jsonc
// .vscode/settings.json
"[feature]": {
  "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
  "editor.formatOnSave": true
}
```

**Key settings:**

| Setting | Default | Description |
|---------|---------|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Spaces to indent steps |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | Align pipes to the step text start |
| `gherkinPowerTools.tags.format` | `"wrap"` | `"wrap"` or `"singleLine"` for tag lists |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Empty lines between scenario blocks |
| `gherkinPowerTools.behave.stepGlobs` | `["**/steps/**/*.py", "**/features/steps/**/*.py"]` | Glob patterns for Python step files |
| `gherkinPowerTools.behave.ignoreGlobs` | `["**/node_modules/**", "**/.venv/**", ...]` | Paths to exclude from step indexing |

📖 [Full configuration reference](https://carlos-camara.github.io/vscode-gherkin-powertools/configuration/)

---

## Documentation

| Topic | Link |
|-------|------|
| Installation guide | [installation.html](https://carlos-camara.github.io/vscode-gherkin-powertools/installation.html) |
| Formatter | [features/formatter.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/formatter.html) |
| Linter and Quick Fixes | [features/linter.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/linter.html) |
| Go to Definition | [features/definition.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/definition.html) |
| IntelliSense and snippets | [features/snippets.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/snippets.html) |
| Hover provider | [features/hover.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/hover.html) |
| Outline | [features/outline.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/outline.html) |
| Project Statistics | [features/statistics.html](https://carlos-camara.github.io/vscode-gherkin-powertools/features/statistics.html) |
| Configuration | [configuration/](https://carlos-camara.github.io/vscode-gherkin-powertools/configuration/) |

---

## Roadmap

Planned features tracked in GitHub Issues. No delivery dates are committed.

- **Playwright BDD step navigation** — [view open issues](https://github.com/carlos-camara/vscode-gherkin-powertools/issues)
- **Cypress step navigation** — [view open issues](https://github.com/carlos-camara/vscode-gherkin-powertools/issues)

[View the full issue backlog →](https://github.com/carlos-camara/vscode-gherkin-powertools/issues)

---

## Contributing

Contributions are welcome. Read the [Contributing Guide](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/CONTRIBUTING.md) for local setup, architecture overview, and testing instructions.

Found a bug or have a feature request? [Open an issue](https://github.com/carlos-camara/vscode-gherkin-powertools/issues/new/choose).

---

## License

MIT License — © [Carlos Camara](https://github.com/carlos-camara)

See [LICENSE](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/LICENSE) for the full text.
