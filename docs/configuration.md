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

<div style="margin: 24px 0; border-radius: 8px; border: 1px solid var(--vscode-panel-border, #e2e8f0); background: var(--vscode-textBlockQuote-background, #f8fafc); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="border-left: 5px solid var(--vscode-editorInfo-foreground, #3b82f6); padding: 16px 20px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--vscode-editorInfo-foreground, #3b82f6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <span style="color: var(--vscode-editorInfo-foreground, #2563eb); font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px;">Note</span>
    </div>
    <div style="color: var(--vscode-editor-foreground, #334155); font-size: 14.5px; line-height: 1.6;">
      Changes to the <code>behave.stepGlobs</code> or <code>behave.ignoreGlobs</code> settings take effect immediately. The extension will automatically reload its step cache and live watchers without requiring you to restart VS Code.
    </div>
  </div>
</div>

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
