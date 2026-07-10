# 📝 Intelligent Snippets

Eliminate boilerplate typing with our built-in autocompletion snippets for common Gherkin blocks.

## ⚡ Available Snippets

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

