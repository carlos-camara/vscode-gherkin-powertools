# 🧠 Intelligent Autocomplete & Snippets

The Gherkin PowerTools supercharges your typing speed using two core mechanisms: **Dynamic Step Autocomplete (IntelliSense)** and **Structural Snippets**.

## 🚀 Smart Autocompletion (IntelliSense)

Tired of memorizing the exact wording of your Python step definitions? The extension automatically parses all `@given`, `@when`, and `@then` functions in your workspace and offers them as intelligent suggestions.

### How it Works
1. **Instant Trigger**: The moment you type a Gherkin keyword followed by a space (e.g. `Given`), the IntelliSense menu appears.
2. **Interactive Variables**: If your Python step uses variables (like `{username}` or `(?P<role>.*)`), they are instantly transformed into VS Code **Snippet Variables**.
3. **Tab-to-Fill**: Select the suggestion, and your cursor will automatically land on the first variable. Fill it in, hit <kbd>Tab</kbd>, and jump straight to the next one!

---

## ⚡ Structural Snippets

| Prefix | Description | Generated Structure |
|--------|-------------|-----------|
| `feature` | Standard Feature block | Scaffolds a full `Feature:` with a `Background:` and a `Scenario:` |
| `scenario` | Standard Scenario block | Scaffolds a `Scenario:` with `Given`, `When`, and `Then` steps |
| `outline` | Scenario Outline | Scaffolds a `Scenario Outline:` with an `Examples:` table structure |
| `rule` | Rule block | Scaffolds a `Rule:` with a nested `Scenario:` |

> [!TIP]
> **How to Trigger**
>
> 1. Open a `.feature` file.
> 2. Type a snippet prefix (e.g., `scenario`).
> 3. Press **`Tab`** or **`Enter`** to expand the block instantly.

---

## 🛠️ Example Expansion

Typing `scenario` + `Tab` generates the following scaffolding, automatically placing your cursor at the first variable placeholder:

```gherkin
Scenario: Scenario name
    Given precondition
    When action
    Then expected result
```

> [!NOTE]
> **Extensibility**
>
> You can easily extend the built-in snippets by creating your own custom workspace snippets in `.vscode/gherkin.code-snippets`.

