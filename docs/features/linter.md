# 🔍 Live Diagnostics (Linter)

Writing Gherkin should be error-free before you even run the tests.

## How It Works

The built-in linter monitors your `.feature` files **in real-time** as you type, using the official `@cucumber/gherkin` AST Parser. If you mistype a keyword or use invalid syntax, the editor immediately underlines the exact offending token in red and provides an explanation in the Problems panel.

## What It Detects

| Rule | Description | Example |
|------|-------------|---------|
| Missing colon | Block keywords must end with `:` | `Scenario` → ❌ should be `Scenario:` |
| Invalid keywords | Detects misspelled Gherkin keywords | `Givn I login` → ❌ |
| Structural errors | Validates proper nesting | Steps outside a Scenario → ❌ |
| Undefined Steps | Integrates with SymbolCache to flag missing steps | `Given I do magic` → ⚠️ |

## 💡 Quick Fixes (Code Actions)

The Linter integrates with VS Code's **Quick Fix** system (the yellow lightbulb 💡) to help you solve issues instantly:

- **Insert missing ':'**: When a block keyword (`Feature`, `Scenario`, etc.) is missing a colon, click the lightbulb and select "Insert missing ':'" to automatically append it.
- **Auto-correct Misspelled Keywords**: When you mistype a keyword (e.g., `Givn`), click the lightbulb and select the suggestion (e.g., "Replace with 'Given'") to fix the typo instantly.
- **Convert to Scenario Outline**: A standard `Scenario` cannot contain an `Examples:` block. If you accidentally add one, a Quick Fix will suggest "Convert to 'Scenario Outline'" to instantly fix the structure.
- **Close table row**: If you forget to add the closing pipe `|` at the end of a Data Table or Examples row, a Quick Fix will detect the inconsistent cell count and offer to "Close table row (append '|')" for you.
- **Crear definición vacía en Python (Create empty step definition)**: When an undefined step is detected (⚠️), click the lightbulb and select "Create empty step definition". The extension will automatically generate a Python stub and insert it into your `steps/` folder, creating the file if necessary or letting you choose if multiple exist.

> [!TIP]
> **Integration**
>
> Diagnostics appear in:
> - **Editor gutter** — Red underlines on the offending line
> - **Problems panel** — `Ctrl+Shift+M` / `Cmd+Shift+M`
> - **Minimap** — Highlights for quick scanning

![Linter Demonstration](../assets/linter.webp)
