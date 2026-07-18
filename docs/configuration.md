# ⚙️ Configuration

Gherkin PowerTools works out-of-the-box, but you can tailor it to your team's style guide via your `settings.json`.

## Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent all steps (`Given`, `When`, `Then`, `And`, `But`). |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | If enabled, tables dynamically pad their left border to match the text length of the preceding step. |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Enforces the exact number of blank lines between `Scenario` and `Rule` blocks. |
| `gherkinPowerTools.tags.format` | `"wrap"` | Choose `"wrap"` to split long tags across lines, or `"singleLine"` to keep them contiguous. |
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
    "gherkinPowerTools.behave.stepGlobs": [
        "**/steps/**/*.py",
        "**/other_steps/**/*.py"
    ]
}
```

## Workspace vs User Settings

- **User Settings**: Apply globally to all your projects.
- **Workspace Settings**: Apply only to the current project (via `.vscode/settings.json`).

!!! tip "Team Standardization"
    For team projects, commit a `.vscode/settings.json` with your preferred Gherkin PowerTools settings so all contributors use the same formatting rules.
