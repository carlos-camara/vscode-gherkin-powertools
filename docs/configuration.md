# ⚙️ Configuration

Gherkin PowerTools works out-of-the-box, but you can tailor it to your team's style guide via your `settings.json`.

## Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent all steps (`Given`, `When`, `Then`, `And`, `But`). |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | If enabled, tables dynamically pad their left border to match the text length of the preceding step. |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Enforces the exact number of blank lines between `Scenario` and `Rule` blocks. |
| `gherkinPowerTools.tags.format` | `"wrap"` | Choose `"wrap"` to split long tags across lines, or `"singleLine"` to keep them contiguous. |
| `gherkinPowerTools.tags.sort` | `"preserve"` | Choose `"preserve"` to keep their original source order, or `"alphabetical"` to sort them A-Z. |
| `gherkinPowerTools.behave.stepGlobs` | `["**/steps/**/*.py", "**/features/steps/**/*.py"]` | An array of glob patterns pointing to Python files that contain Behave steps. Used for linking, hovers, linting, and autocomplete. |
| `gherkinPowerTools.behave.ignoreGlobs` | `["**/node_modules/**", "**/.venv/**", "**/venv/**", "**/env/**"]` | An array of glob patterns to exclude from step discovery. |
| `gherkinPowerTools.behave.additionalArguments` | `[]` | Additional flags passed to Behave when executing via CodeLens. **Tip:** You can edit these interactively at runtime by clicking the `✎ Edit` CodeLens above any scenario, which can save them here for you (fully DevContainer compatible). |
| `gherkinPowerTools.behave.command` | `"behave"` | The base command used to run Behave when executing via CodeLens. |

<br>

## Configuration Profiles

To dramatically simplify project setup, you can set a baseline `gherkinPowerTools.profile` in your configuration file. Predefined profiles automatically configure all styling options simultaneously.

| Profile | Indentation | Table Alignment | Tags | Description |
|---------|-------------|-----------------|------|-------------|
| `team` (default) | 4 spaces | Aligned to keyword | Wrapped, preserved | Recommended standard for new teams |
| `strict` | 4 spaces | Aligned to keyword | Wrapped, alphabetical | For teams enforcing strict tag sorting |
| `minimal` | 2 spaces | Off | Single-line | Compact formatting, avoids table padding |
| `legacy` | 2 spaces | Aligned to keyword | Single-line | Best for older projects with 2-space indents |

```json
{
  "profile": "minimal",
  "indentation": { "steps": 4 } // You can still override individual settings!
}
```

<br>

**ℹ️ NOTE:** *Changes to the `behave.stepGlobs` or `behave.ignoreGlobs` settings take effect immediately. The extension will automatically reload its step cache and live watchers without requiring you to restart VS Code.*

<br>

## Automated First-Run Onboarding

When you open a workspace containing Python Behave files, Gherkin PowerTools automatically inspects your workspace layout. If step definitions (Python files with `@given`, `@when`, `@then`, `@step` decorators or `environment.py`) exist in non-standard folders not currently matched by `behave.stepGlobs`, a non-blocking notification offers 1-click actions:

* **⚙️ Settings:** Safely appends the recommended glob patterns to `.vscode/settings.json`.
* **📄 Config:** Creates or merges the recommended patterns into `.gherkin-powertoolsrc.json`.
* **🩺 Diagnostics:** Triggers `Gherkin: Diagnose Workspace` report.

## Example Configuration

```json
{
    "gherkinPowerTools.indentation.steps": 2,
    "gherkinPowerTools.tables.alignToKeyword": true,
    "gherkinPowerTools.emptyLines.betweenScenarios": 1,
    "gherkinPowerTools.tags.format": "wrap",
    "gherkinPowerTools.tags.sort": "preserve",
    "gherkinPowerTools.behave.stepGlobs": [
        "**/steps/**/*.py",
        "**/other_steps/**/*.py"
    ],
    "gherkinPowerTools.behave.command": "poetry run behave",
    "gherkinPowerTools.behave.additionalArguments": [
        "--no-capture"
    ]
}
```

## Workspace vs User Settings

Gherkin PowerTools supports configuration at three levels, in the following order of precedence:

1. **Project Settings (`.gherkin-powertoolsrc.json`)**: Apply only to the current project and can be committed to source control for team standardization.
2. **Workspace Settings (`.vscode/settings.json`)**: Apply only to the current workspace in VS Code.
3. **User Settings (`settings.json`)**: Apply globally to all your projects.

### Shared Project Configuration

You can create a standalone configuration file named `.gherkin-powertoolsrc.json` in the root of your project. This is highly recommended for teams to ensure everyone uses the same formatting and discovery rules, regardless of their editor.

The extension provides full JSON schema validation, autocompletion, and hover documentation when editing this file in VS Code.

**Example `.gherkin-powertoolsrc.json`:**
```json
{
    "indentation": {
        "steps": 4
    },
    "tables": {
        "alignToKeyword": true
    },
    "tags": {
        "format": "wrap",
        "sort": "preserve"
    },
    "emptyLines": {
        "betweenScenarios": 1
    },
    "behave": {
        "stepGlobs": [
            "**/steps/**/*.py",
            "**/features/steps/**/*.py"
        ],
        "ignoreGlobs": [
            "**/node_modules/**",
            "**/.venv/**"
        ],
        "command": "behave",
        "additionalArguments": []
    }
}
```

!!! tip "Team Standardization"
    Commit a `.gherkin-powertoolsrc.json` to your repository so all contributors share the same formatting rules and step discovery paths!
