# 🚀 Automated First-Run Onboarding

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/onboarding.gif" alt="Automated First-Run Onboarding Demo" width="600" />
</div>

Gherkin PowerTools automatically detects Python/Behave workspaces on startup, analyzes step coverage, and configures your workspace with 1 click.

---

## ⚡ How It Works

1. **Silent Background Inspection**: Upon opening a workspace containing `.feature` or `.py` files, Gherkin PowerTools inspects your directory structure.
2. **Coverage Gap Analysis**: The extension checks whether Python step files (containing `@given`, `@when`, `@then`, `@step` decorators or `environment.py`) exist in custom folders not currently matched by `behave.stepGlobs`.
3. **Non-Intrusive Prompt**: If step files are discovered in non-standard locations, a single non-blocking notification appears with automated resolution options.

---

## 🛠️ 1-Click Resolution Actions

| Action | Description |
|--------|-------------|
| **⚙️ Settings** | Appends the detected step patterns directly to your `.vscode/settings.json`. |
| **📄 Config** | Generates or merges the recommended step globs into a team-shared `.gherkin-powertoolsrc.json` config file. When creating a new file, it automatically enables the `strict` formatting profile. |
| **🩺 Diagnostics** | Launches `Gherkin: Diagnose Workspace` to generate a full system report. |

---

## 🛡️ Zero-Config Non-Behave Support

For pure Gherkin, Cucumber.js, SpecFlow, or Playwright BDD projects that do not use Python/Behave:
- The onboarding scanner operates silently in the background.
- It detects the absence of Python step files and suppresses all prompts.
- All core formatting, linting, tag telemetry, and outline navigation features work 100% zero-configuration out-of-the-box.
