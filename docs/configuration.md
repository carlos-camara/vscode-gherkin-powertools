# ⚙️ Configuration

Gherkin PowerTools works out-of-the-box, but you can tailor it to your team's style guide via your `settings.json`.

## Available Settings

### Formatting

| Setting | Default | Description |
|---------|---------|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent all steps (`Given`, `When`, `Then`, `And`, `But`). |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | If enabled, tables dynamically pad their left border to match the text length of the preceding step. |
| `gherkinPowerTools.emptyLines.betweenScenarios` | `1` | Enforces the exact number of blank lines between `Scenario` and `Rule` blocks. |
| `gherkinPowerTools.tags.format` | `"wrap"` | Choose `"wrap"` to split long tags across lines, or `"singleLine"` to keep them contiguous. |

### Behave Step Discovery

| Setting | Default | Description |
|---------|---------|-------------|
| `gherkinPowerTools.behave.stepGlobs` | `["**/steps/**/*.py", "**/features/steps/**/*.py"]` | Glob patterns for Python files the extension indexes and actively watches for step definitions. Changes apply **in real-time** without reloading the window. |
| `gherkinPowerTools.behave.ignoreGlobs` | `["**/node_modules/**", "**/.venv/**", "**/venv/**", "**/env/**"]` | Glob patterns to exclude from step discovery. Files matching these patterns are ignored during both initial indexing and live file events. |

## Example Configuration

```json
{
    "gherkinPowerTools.indentation.steps": 2,
    "gherkinPowerTools.tables.alignToKeyword": true,
    "gherkinPowerTools.emptyLines.betweenScenarios": 1,
    "gherkinPowerTools.tags.format": "wrap",
    "gherkinPowerTools.behave.stepGlobs": [
        "**/steps/**/*.py",
        "**/tests/step_definitions/**/*.py"
    ],
    "gherkinPowerTools.behave.ignoreGlobs": [
        "**/node_modules/**",
        "**/.venv/**",
        "**/venv/**"
    ]
}
```

## Workspace vs User Settings

- **User Settings**: Apply globally to all your projects.
- **Workspace Settings**: Apply only to the current project (via `.vscode/settings.json`).

!!! tip "Team Standardization"
    For team projects, commit a `.vscode/settings.json` with your preferred Gherkin PowerTools settings so all contributors use the same formatting rules.

## Hot-Reloading Behave Configuration

When you modify `stepGlobs` or `ignoreGlobs` in your settings, the extension automatically:

1. Disposes all existing filesystem watchers.
2. Clears the in-memory Symbol Cache.
3. Re-indexes the workspace using the new glob patterns.
4. Re-lints all currently open `.feature` files.

No window reload is required.
