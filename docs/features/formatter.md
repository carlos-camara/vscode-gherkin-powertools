# 🎨 Intelligent Formatter

The core feature of Gherkin Beautifier. Powered by the official `@cucumber/gherkin` Abstract Syntax Tree (AST) parser, the robust formatting engine analyzes your Gherkin syntax with mathematical precision and aligns it automatically.

> [!TIP]
> **How to Use**
>
> - **Full Document**: `Shift+Alt+F` or right-click → "Format Gherkin Document"
> - **Selection Only**: Highlight text → `Cmd+K Cmd+F` / `Ctrl+K Ctrl+F`
> - **On Save**: Enable `editor.formatOnSave` (see [Configuration](../configuration.md))

## Capabilities

### AST-Powered Flat Indentation
Enforces consistent alignment where all steps (`Given`, `When`, `Then`, `And`) share the exact same starting column. Since it uses an AST, it correctly ignores keywords hidden inside DocStrings or Comments.

### Smart Table Alignment
Data tables (pipes `|`) dynamically pad themselves to align perfectly with the keyword of the preceding step.

```gherkin
    Given I have a database
          | id | name  |
          | 1  | admin |
```

### Auto-Casing
Automatically capitalizes Gherkin keywords (`given` → `Given`) while supporting multiple languages.

### Tag Wrapping
Keeps your files clean by intelligently wrapping long `@tags` lists that exceed 80 characters.

### Multi-language Support (i18n)
Fully supports formatting in **English**, **Spanish**, **French**, and **German**:

| English | Spanish | French | German |
|---------|---------|--------|--------|
| Given | Dado | Soit | Angenommen |
| When | Cuando | Quand | Wenn |
| Then | Entonces | Alors | Dann |
| Scenario | Escenario | Scénario | Szenario |

![Formatter Demonstration](../assets/formatter.webp)
