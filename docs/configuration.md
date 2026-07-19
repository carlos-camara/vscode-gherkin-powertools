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
| `gherkinPowerTools.behave.stepGlobs` | `["**/steps/**/*.py"]` | An array of glob patterns pointing to Python files that contain Behave steps. Used for linking, hovers, linting, and autocomplete. |
| `gherkinPowerTools.behave.ignoreGlobs` | `["**/node_modules/**"]` | An array of glob patterns to exclude from step discovery. |

<br>

**ℹ️ NOTE:** *Changes to the `behave.stepGlobs` or `behave.ignoreGlobs` settings take effect immediately. The extension will automatically reload its step cache and live watchers without requiring you to restart VS Code.*

<br>

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
        ]
    }
}
```

!!! tip "Team Standardization"
    Commit a `.gherkin-powertoolsrc.json` to your repository so all contributors share the same formatting rules and step discovery paths!
