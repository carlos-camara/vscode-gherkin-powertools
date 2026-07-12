# 🎨 Intelligent Formatter

The core feature of Gherkin PowerTools. Powered by the official `@cucumber/gherkin` Abstract Syntax Tree (AST) parser, the robust formatting engine analyzes your Gherkin syntax with mathematical precision and aligns it automatically. It transforms messy, unreadable tests into a pristine, standardized format instantly.

> [!TIP]
> **How to Trigger Formatting**
>
> - **Full Document**: `Shift+Alt+F` (Windows/Linux) or `⇧⌥F` (macOS).
> - **Selection Only**: Highlight text → `Cmd+K Cmd+F` / `Ctrl+K Ctrl+F`.
> - **On Save**: Enable `editor.formatOnSave` in your `settings.json` (see [Configuration](../configuration.md)).

---

## ✨ Formatting Capabilities

### AST-Powered Flat Indentation
Enforces a consistent alignment strategy where all operational steps (`Given`, `When`, `Then`, `And`, `But`) share the exact same starting column. Because it operates on an AST rather than simple Regex, it flawlessly ignores keywords hidden inside DocStrings or comments.

### Dynamic Table Alignment
Data tables and `Examples` blocks (using pipes `|`) are dynamically padded. The formatter calculates the maximum column width and aligns the entire table perfectly to the preceding step keyword.

```gherkin
    Given I have a database
          | id | username | role  |
          | 1  | admin    | super |
          | 2  | test     | read  |
```

### Auto-Casing & Keyword Normalization
Automatically capitalizes Gherkin keywords (`given` → `Given`, `scenario outline` → `Scenario Outline`) to enforce strict standardization across your suite.

### Intelligent Tag Wrapping
Keeps your files clean by intelligently wrapping long lists of `@tags` that exceed 80 characters. It respects logical grouping and indents them correctly above the Scenario or Feature block.

### Unmapped Descriptions & DocStrings
Preserves multi-line descriptions directly beneath `Feature` and `Scenario` blocks without corrupting their indentation. Flawlessly formats `"""` DocStrings relative to their parent step.

### Multi-language Support (i18n)
Fully supports formatting in **English**, **Spanish**, **French**, and **German**. It detects the `# language: <lang>` header and applies the correct localized casing rules:

| English | Spanish | French | German |
|---------|---------|--------|--------|
| Given | Dado | Soit | Angenommen |
| When | Cuando | Quand | Wenn |
| Then | Entonces | Alors | Dann |
| Scenario | Escenario | Scénario | Szenario |

![Formatter Demonstration](../assets/formatter.webp)
