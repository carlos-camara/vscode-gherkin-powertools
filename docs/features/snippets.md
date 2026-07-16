# 🧠 Intelligent Autocomplete & Snippets

The Gherkin PowerTools supercharges your typing speed using two core mechanisms: **Dynamic Step Autocomplete (IntelliSense)** and **Structural Snippets**.

## 🚀 Smart Autocompletion (IntelliSense)

Tired of memorizing the exact wording of your Python step definitions? The extension automatically parses all `@given`, `@when`, and `@then` functions in your workspace and offers them as intelligent suggestions.

### How it Works
1. **Instant Trigger**: The moment you type a Gherkin keyword followed by a space (e.g. `Given`), the IntelliSense menu appears.
2. **Context-Aware Filtering**: The extension strictly filters suggestions to match your context. If you type `When`, you will only see `@when` and generic `@step` suggestions.
3. **Smart `And`/`But` Resolution**: Typing `And` or `But` dynamically scans upward to inherit the context of the preceding primary step.
4. **Interactive Variables**: If your Python step uses variables (like `{username:d}` or `(?P<role>.*)`), they are instantly transformed into VS Code **Snippet Variables**.
5. **Tab-to-Fill**: Select the suggestion, and your cursor will automatically land on the first variable. Fill it in, hit <kbd>Tab</kbd>, and jump straight to the next one!

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/completion.gif" alt="IntelliSense Demonstration" width="600" />
</div>

### 📊 Scenario Outline Parameter Autocompletion

When working within a `Scenario Outline` or `Scenario Template`, you frequently need to reference columns from the underlying `Examples` table using the `<parameter>` syntax.

**How it works:**
1. Inside a `Scenario Outline`, type `<` anywhere within a step.
2. The extension instantly scans downward, parses the `Examples` table, and extracts all column headers.
3. An IntelliSense dropdown appears with your exact table headers.
4. Select a header, and the extension automatically inserts the header name along with the closing bracket `>`.

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/outline-completion.gif" alt="Scenario Outline Autocompletion" width="600" />
</div>

---

## ⚡ Structural Snippets

| Prefix | Description | Generated Structure |
|--------|-------------|-----------|
| `feature` | Standard Feature block | Scaffolds a full `Feature:` with a `Background:` and a `Scenario:` |
| `scenario` | Standard Scenario block | Scaffolds a `Scenario:` with `Given`, `When`, and `Then` steps |
| `outline` | Scenario Outline | Scaffolds a `Scenario Outline:` with an `Examples:` table structure |
| `rule` | Rule block | Scaffolds a `Rule:` with a nested `Scenario:` |

<div style="border-radius: 8px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid #d1d5db;">
  <div style="background: #1f2937; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 16px;">💡</span>
    <span style="color: #f9fafb; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">How to Trigger</span>
  </div>
  <div style="background-color: #ffffff; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="background: #1f2937; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; line-height: 20px; text-align: center;">1</span>
      <span style="color: #374151; font-size: 13px; padding-top: 2px;">Open a <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">.feature</code> file.</span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="background: #1f2937; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; line-height: 20px; text-align: center;">2</span>
      <span style="color: #374151; font-size: 13px; padding-top: 2px;">Type a snippet prefix (e.g., <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">scenario</code>).</span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="background: #1f2937; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; line-height: 20px; text-align: center;">3</span>
      <span style="color: #374151; font-size: 13px; padding-top: 2px;">Press
        <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">Tab</kbd> or
        <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">Enter</kbd> to expand the block instantly.
      </span>
    </div>
  </div>
</div>

---

## 🛠️ Example Expansion

Typing `scenario` + `Tab` generates the following scaffolding, automatically placing your cursor at the first variable placeholder:

```gherkin
Scenario: Scenario name
    Given precondition
    When action
    Then expected result
```

<div style="border-radius: 8px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid #d1d5db;">
  <div style="background: #1f2937; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 16px;">📝</span>
    <span style="color: #f9fafb; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Extensibility</span>
  </div>
  <div style="background-color: #ffffff; padding: 14px 16px;">
    <span style="color: #374151; font-size: 13px;">You can easily extend the built-in snippets by creating your own custom workspace snippets in <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">.vscode/gherkin.code-snippets</code>.</span>
  </div>
</div>

