<!-- markdownlint-disable MD041 MD033 -->

<div align="center">

<img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/logo-transparent.png" alt="Gherkin PowerTools logo" width="120" /><br/>

# Gherkin PowerTools

**Write cleaner Gherkin. Catch errors earlier. Execute & Debug Behave scenarios in one click.**

AST-powered formatting, validation, navigation, execution, debugging and analytics for Gherkin projects, with first-class Python/Behave support.

<br/>

[![Install from Marketplace](https://img.shields.io/badge/VS%20Code%20Marketplace-Install-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![Version](https://vsmarketplacebadges.dev/version-short/carloscamara.vscode-gherkin-powertools.svg?style=flat-square&color=007ACC)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![Installs](https://vsmarketplacebadges.dev/installs-short/carloscamara.vscode-gherkin-powertools.svg?style=flat-square&color=28A745)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/carloscamara.vscode-gherkin-powertools.svg?style=flat-square&color=8A2BE2)](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.93-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/LICENSE)

</div>

---

**Jump to:** [Who is this for?](#who-is-this-for) · [Core Capabilities](#core-capabilities) · [Comparison](#compared-to-cucumber-official) · [Quick Start](#quick-start) · [Configuration](#configuration) · [Documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/)

---

## Primary Demo

<div align="center">

![Formatter demo — tables, tags and indentation aligned in one keystroke](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif)

*Format Document <kbd>⇧⌥F</kbd> — tables, tags and indentation aligned in one keystroke*

</div>

---

## Who is this for?

Gherkin PowerTools is built for QA engineers, developers, and BDD teams working with Gherkin feature files.

### ❓ Do I need Behave / Python?
**No!** 

* **Any `.feature` file (Cucumber.js, Playwright BDD, SpecFlow, Karate, etc.):** 
  Zero-configuration AST-based formatting, real-time syntax linting, 70+ language i18n support, AST range selection formatting, tag telemetry, and workspace statistics work out-of-the-box for **every** Gherkin project.
* **Python / Behave Workspaces:** 
  Unlocks deep step definition indexing (Go to Definition, Hover, IntelliSense), missing step stub generator, and 1-click test **Execution & Debugging** via CodeLens directly inside VS Code.

---

## Core Capabilities

### 1. ⚡ AST-Powered Formatting
**Problem:** Misaligned table pipes, messy tags, and erratic indentation create noisy git diffs and slow code reviews.  
**Solution:** Format Document rewrites your feature file using the official `@cucumber/gherkin` AST parser. Tables snap to step text, tags wrap cleanly at 80 characters, and formatting is 100% idempotent.

<div align="center">

![Formatter — aligns tables, wraps tags, enforces indentation](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif)

</div>

<sub>📖 [Formatter documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/formatter.html)</sub>

---

### 2. 🛡️ Real-Time Linter & Quick Fixes
**Problem:** A missing colon or misspelled keyword silently reaches CI and breaks your test pipeline.  
**Solution:** A fully **dialect-aware** AST linter flags structural errors across 70+ languages as you type. One-click Quick Fixes (<kbd>Ctrl+.</kbd> / <kbd>⌘.</kbd>) fix common typos and missing colons instantly.

<div align="center">

![Linter — real-time error detection](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/linter.gif)

</div>

<sub>📖 [Linter documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/linter.html)</sub>

---

### 3. 🚀 1-Click Execution & Debugging (CodeLens)
**Problem:** Switching context between the editor and terminal to run isolated scenarios or attach debuggers breaks focus.  
**Solution:** Interactive `▶ Run`, `🐞 Debug`, and `✏️ Edit` buttons appear directly above Features and Scenarios. Execute tests using your active VS Code Python environment or step through Python step definitions with breakpoints.

<div align="center">

![Execute Scenarios via CodeLens — One-click isolated execution and custom arguments](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/run-debug.gif)

</div>

<sub>📖 [Execution & Debugging documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/execution.html)</sub>

---

### 4. 🔍 Python/Behave Navigation & Step IntelliSense
**Problem:** Finding the Python implementation behind a Gherkin step requires searching through step folders manually.  
**Solution:** <kbd>Cmd+Click</kbd> / <kbd>Ctrl+Click</kbd> any step to jump straight to its Python `@given`, `@when`, `@then` decorator. Get context-aware step completion and preview function signatures on hover.

<div align="center">

![Go to Definition — Cmd-click a step, land on the Python decorator](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/goto-definition.gif)

</div>

<sub>📖 [Go to Definition](https://carlos-camara.github.io/vscode-gherkin-powertools/features/definition.html) · [Hover](https://carlos-camara.github.io/vscode-gherkin-powertools/features/hover.html)</sub>

---

### 5. 📊 Workspace BDD Analytics
**Problem:** Difficulty assessing the size, health, and test distribution of your BDD suite.  
**Solution:** The Project Statistics dashboard compiles workspace metrics: feature counts, scenario outlines, step ratios, tag telemetry, and a Gherkin Quality Indicator.

<div align="center">

![Project Statistics — workspace metrics from the Cucumber AST](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/dashboard.gif)

</div>

<sub>📖 [Statistics documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/features/statistics.html) · [Full Visual Demo Gallery](https://carlos-camara.github.io/vscode-gherkin-powertools/demos.html)</sub>

---

## Compatibility Matrix

| Feature | Any `.feature` file | Python / Behave | Notes |
|---------|:-------------------:|:---------------:|-------|
| Table & Tag Formatting | ✅ | ✅ | Cucumber, Playwright BDD, SpecFlow, Karate |
| Real-Time Syntax Diagnostics | ✅ | ✅ | 70+ languages supported via i18n headers |
| Keyword Quick Fixes | ✅ | ✅ | Auto-inserts missing colons & fixes typos |
| AST Range Selection Formatting | ✅ | ✅ | Format specific step blocks or tables |
| Project Statistics & Tag Telemetry | ✅ | ✅ | Interactive HTML Dashboard |
| Go to Definition | — | ✅ | Jump from step to `@step` decorator |
| Step IntelliSense Autocomplete | — | ✅ | Context-aware by step keyword |
| Run & Debug via CodeLens | — | ✅ | 1-click execution & breakpoint debugging |
| Undefined Step Stub Generator | — | ✅ | Generates Python function stub |

---

## Compared to Cucumber Official

Both extensions can coexist peacefully and serve complementary purposes:

| Capability | Gherkin PowerTools | Official Cucumber |
|-----------|:-----------------:|:-----------------:|
| Table alignment | ✅ Dynamic to step keyword | ✅ Basic |
| Tag wrapping & sorting | ✅ | — |
| Real-time structural linting | ✅ AST-based | ✅ Syntax + undefined steps |
| Keyword Quick Fixes | ✅ | — |
| Python / Behave Navigation | ✅ First-class | — |
| 1-Click Run & Debug | ✅ CodeLens | — |
| Workspace Statistics Dashboard | ✅ | — |
| Language Server Protocol (LSP) | — | ✅ (all frameworks) |

*💡 **PRO-TIP:** Install both! Gherkin PowerTools handles formatting, linting, Python/Behave navigation, execution, and analytics. The Official Cucumber extension provides generic LSP support for JavaScript/Java frameworks.*

---

## Quick Start

1. Install **Gherkin PowerTools** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools).
2. Open any `.feature` file.
3. Press <kbd>Shift+Alt+F</kbd> (<kbd>⇧⌥F</kbd> on macOS) to format your file instantly.

For Python/Behave navigation and execution, ensure your step files match the default glob patterns (`**/steps/**/*.py`, `**/features/steps/**/*.py`) or update `gherkinPowerTools.behave.stepGlobs`.

### Key Shortcuts

| Action | macOS | Windows / Linux |
|--------|-------|-----------------|
| Format Document | <kbd>⇧⌥F</kbd> | <kbd>Shift+Alt+F</kbd> |
| Format Selection | <kbd>⌘K ⌘F</kbd> | <kbd>Ctrl+K Ctrl+F</kbd> |
| Quick Fix | <kbd>⌘.</kbd> | <kbd>Ctrl+.</kbd> |
| Go to Definition | <kbd>⌘Click</kbd> | <kbd>Ctrl+Click</kbd> / <kbd>F12</kbd> |
| Trigger Completion | <kbd>⌃Space</kbd> | <kbd>Ctrl+Space</kbd> |

---

## Configuration

Share formatting and step discovery settings across your team by creating a `.gherkin-powertoolsrc.json` in the root of your project:

```json
{
  "indentation": { "steps": 4 },
  "behave": {
    "stepGlobs": ["**/steps/**/*.py", "**/features/steps/**/*.py"]
  }
}
```

Or enable **Format on Save** in your VS Code settings:

```jsonc
// .vscode/settings.json
"[feature]": {
  "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
  "editor.formatOnSave": true
}
```

### Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent steps |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | Align pipes to step text start |
| `gherkinPowerTools.tags.format` | `"wrap"` | `"wrap"` or `"singleLine"` for tag lists |
| `gherkinPowerTools.tags.sort` | `"preserve"` | `"preserve"` or `"alphabetical"` for tag ordering |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Empty lines between scenario blocks |
| `gherkinPowerTools.behave.stepGlobs` | `["**/steps/**/*.py", "**/features/steps/**/*.py"]` | Glob patterns for Python step files |
| `gherkinPowerTools.behave.ignoreGlobs` | `["**/node_modules/**", "**/.venv/**", "**/venv/**", "**/env/**"]` | Paths to exclude from step indexing |
| `gherkinPowerTools.behave.additionalArguments` | `[]` | Additional flags passed to Behave |
| `gherkinPowerTools.behave.command` | `"behave"` | Base command used to run Behave via CodeLens |

📖 [Full Configuration Reference & Documentation](https://carlos-camara.github.io/vscode-gherkin-powertools/)

---

## Contributing & License

Contributions are welcome! Please check out the [Contributing Guide](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/CONTRIBUTING.md).

Released under the [MIT License](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/LICENSE) — © [Carlos Camara](https://github.com/carlos-camara).
