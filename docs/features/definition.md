# 🧭 Go To Definition

Instantly jump from a `.feature` file to the exact Python step definition.

## How to Use

- **Cmd + Click** (macOS) or **Ctrl + Click** (Windows/Linux) on any step
- Or press **F12** with the cursor on a step

## How It Works

When you open your workspace, the extension builds an ultra-fast **In-Memory Symbol Cache** by scanning your `.py` files. 

When you click on a step like `Given I login`:

1. Extracts the step text (e.g., `I login`)
2. Instantly queries the Symbol Cache in RAM (0ms latency).
3. Finds the matching Python decorator (`@given('I login')`)
4. Opens the `.py` file at the exact line

The cache automatically updates in the background when you create, modify, or delete Python files.

## Supported Decorators

The provider recognizes all standard Behave/Cucumber Python decorators:

```python
@given('I login')
@when(r'I click the button "(?P<button_name>[^"]*)"')
@then(f'I should see the dashboard')
@step(u'I perform an action')
```

The definition provider also handles:
- Behave named regex groups: `(?P<variable>...)`
- Behave bracket variables: `{variable}`
- Python string literal prefixes: `r`, `u`, `f`, `b`

> [!WARNING]
> **Requirements**
>
> - Python step files must be in a `steps/` directory (any depth)
> - Decorators must use `@given`, `@when`, `@then`, or `@step`

![Go To Definition](../assets/definition.webp)
