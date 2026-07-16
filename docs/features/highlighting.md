# 💡 Syntax Highlighting

Replaces glaring, standard colors with a curated palette that looks stunning on dark themes.

## Color Palette

| Category | Keywords | Color | Hex |
|----------|----------|-------|-----|
| **Structure** | `Feature`, `Scenario`, `Rule`, `Background` | Elegant Purple | `#C586C0` |
| **Actions** | `Given`, `When`, `Then`, `And`, `But` | Crisp Blue | `#569CD6` |
| **Tags** | `@smoke`, `@api`, `@wip` | Soft Cyan | `#4EC9B0` |

## How It Works

The highlighter uses VS Code's `createTextEditorDecorationType` API to apply custom decorations. This means it works **on top of any theme** — including Dark+, Monokai, and One Dark Pro.

<div style="border-radius: 8px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid #d1d5db;">
  <div style="background: #1f2937; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 16px;">💡</span>
    <span style="color: #f9fafb; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Automatic Activation</span>
  </div>
  <div style="background-color: #ffffff; padding: 14px 16px;">
    <span style="color: #374151; font-size: 13px;">Syntax highlighting activates automatically when you open any <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">.feature</code> or <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">.gherkin</code> file. No configuration needed.</span>
  </div>
</div>

<div align="center">
  <img src="../../assets/highlighting.gif" alt="Syntax Highlighting" width="600" />
</div>
