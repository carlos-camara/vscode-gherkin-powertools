# 🔍 Live Diagnostics & Quick Fixes

Writing Gherkin should be error-free before you even execute your test suite. The **Gherkin Beautifier** integrates a real-time semantic and syntactic linter directly into VS Code to catch mistakes the moment you type them.

## ⚙️ How It Works

The built-in linter monitors your `.feature` files **in real-time** using the official `@cucumber/gherkin` AST Parser. If you mistype a keyword, use invalid syntax, or violate Gherkin semantics, the editor immediately underlines the exact offending token and provides an explanation in the Problems panel.

## 🛡️ What It Detects

| Diagnostic | Rule Description | Example |
|------------|------------------|---------|
| **Missing Colon** | Block keywords must end with `:` | `Scenario` → ❌ should be `Scenario:` |
| **Invalid Keyword** | Detects misspelled Gherkin keywords | `Givn I login` → ❌ should be `Given` |
| **Semantic Error** | Validates proper structural nesting | A `Scenario` containing an `Examples:` block → ⚠️ |
| **Table Inconsistency** | Verifies data table integrity | Forgetting a closing `|` in a table row → ❌ |
| **Undefined Step** | Cross-references the Symbol Cache | `Given I do magic` (no Python match) → ⚠️ |

---

## 💡 Intelligent Code Actions (Quick Fixes)

The Linter integrates deeply with VS Code's **Quick Fix** system (the yellow lightbulb 💡). Instead of just pointing out errors, the extension actively offers to fix them for you. 

When a diagnostic appears, click the lightbulb or press `Cmd+.` (macOS) / `Ctrl+.` (Windows/Linux) to trigger an auto-correction:

- **Insert missing ':'**: When a block keyword (`Feature`, `Scenario`, etc.) is missing a colon, this action instantly appends it.
- **Replace with '{Keyword}'**: When you mistype a keyword (e.g., `Givn`), this action intelligently suggests the closest valid keyword and fixes the typo instantly.
- **Convert to 'Scenario Outline'**: A standard `Scenario` cannot contain an `Examples:` block. If you accidentally add one, this action instantly converts the block to a `Scenario Outline`.
- **Close table row (append '\|')**: If you forget to add the closing pipe `|` at the end of a Data Table or Examples row, this action detects the inconsistent cell count and appends the pipe for you.
- **Create empty step definition**: When an undefined step is detected (⚠️), this action automatically generates a Python stub (`@given(...)`) and inserts it into your `steps/` folder, creating the file if necessary or letting you choose if multiple exist.

> [!TIP]
> **Integration Ecosystem**
>
> Diagnostics appear natively in:
> - **Editor Gutter** — Red and yellow underlines on the offending lines.
> - **Problems Panel** — Accessible via `Ctrl+Shift+M` / `Cmd+Shift+M`.
> - **Minimap** — Color-coded highlights in the scroll bar for rapid scanning.

![Linter Demonstration](../assets/linter.webp)
