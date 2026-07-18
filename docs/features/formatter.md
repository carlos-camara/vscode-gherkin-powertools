# 🎨 Intelligent Formatter

The core feature of Gherkin PowerTools. Powered by the official `@cucumber/gherkin` Abstract Syntax Tree (AST) parser, the robust formatting engine analyzes your Gherkin syntax with mathematical precision and aligns it automatically. It transforms messy, unreadable tests into a pristine, standardized format instantly.

<div style="border-radius: 8px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid #d1d5db;">
  <div style="background: #1f2937; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 16px;">💡</span>
    <span style="color: #f9fafb; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">How to Trigger Formatting</span>
  </div>
  <div style="background-color: #ffffff; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="color: #6b7280; font-size: 16px; flex-shrink: 0; line-height: 1;">◆</span>
      <span style="color: #374151; font-size: 13px;">
        <strong style="color: #111827;">Full Document</strong>:
        <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">Shift+Alt+F</kbd> (Windows/Linux) or
        <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">⇧⌥F</kbd> (macOS).
      </span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="color: #6b7280; font-size: 16px; flex-shrink: 0; line-height: 1;">◆</span>
      <span style="color: #374151; font-size: 13px;">
        <strong style="color: #111827;">Selection Only</strong>: Highlight text →
        <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">Cmd+K Cmd+F</kbd> /
        <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">Ctrl+K Ctrl+F</kbd>.
      </span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="color: #6b7280; font-size: 16px; flex-shrink: 0; line-height: 1;">◆</span>
      <span style="color: #374151; font-size: 13px;">
        <strong style="color: #111827;">On Save</strong>: Enable
        <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">editor.formatOnSave</code> in your
        <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">settings.json</code> (see <a href="../configuration.md">Configuration</a>).
      </span>
    </div>
  </div>
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif" alt="Formatter Demonstration" width="600" />
</div>

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



### Intelligent Tag Wrapping
Keeps your files clean by intelligently wrapping long lists of `@tags` that exceed 80 characters. It respects logical grouping and indents them correctly above the Scenario or Feature block.

### AST-Scoped Range Formatting
When formatting a specific selection (`Format Selection`), the engine identifies the **smallest complete AST node** that fully encompasses your selection and formats it atomically. Selecting a single row in a DataTable will dynamically re-align the entire table, and selecting part of a DocString will format the entire block perfectly.

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
