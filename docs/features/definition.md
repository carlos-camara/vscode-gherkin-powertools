# 🧭 Go To Definition

Stop searching for step implementations manually. Gherkin PowerTools allows you to instantly jump from any `.feature` file step directly to its underlying Python execution code.

## ⚡ How to Trigger

- **Mouse**: `Cmd + Click` (macOS) or `Ctrl + Click` (Windows/Linux) on any step.
- **Keyboard**: Place your cursor on a step and press **`F12`**.
- **Context Menu**: Right-click on a step → **"Go to Definition"**.

---

## 🧠 How It Works (The Symbol Cache)

When you open a workspace containing Gherkin files, the extension asynchronously builds a non-blocking **In-Memory Symbol Cache** by scanning your `.py` files in the background using `vscode.workspace.findFiles`.

When you request a definition (e.g., clicking on `Given I login as "admin"`):

1. **Extraction**: The extension extracts the semantic step text (`I login as "admin"`).
2. **Evaluation**: It strips dynamic Gherkin data variables and normalizes the string.
3. **Lookup**: It queries the Symbol Cache in RAM via `getStepDefinitions()` which returns *all* matches.
4. **Navigation**: It locates the matching Python decorator and instantly opens the file directly at that exact line. If multiple definitions exist, the editor allows selecting between them.

> [!NOTE]
> **Dynamic Updates**
> The cache is fully reactive. It automatically updates asynchronously in the background whenever you create, modify, or delete Python files, ensuring your definitions are always perfectly in sync.

---

## 🐍 Supported Python Decorators

The definition provider is natively compatible with standard `behave` and `pytest-bdd` Python decorators. It supports complex regex matching, f-strings, raw strings, and robust multi-line decorator formatting.

```python
# Standard Exact Match
@given('I login')
def step_login(context): ...

# Regex with Named Groups
@when(r'I click the button "(?P<button_name>[^"]*)"')
def step_click(context, button_name): ...

# Formatted F-Strings & Bracket Variables
@then(f'I should see the {dashboard}')
def step_see(context, dashboard): ...

# Unicode/Byte prefixes and @step alias
@step(u'I perform an action')
def step_action(context): ...
```

> [!WARNING]
> **Workspace Requirements**
>
> - Python step implementation files must be located inside a directory named `steps/` (at any nesting depth).
> - Python functions must be decorated with `@given`, `@when`, `@then`, or `@step`.

![Go To Definition Demonstration](../assets/definition.webp)
