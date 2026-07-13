# 🖱️ Hover Documentation Preview

Context-switching between your `.feature` files and your Python codebase is a thing of the past. The Gherkin PowerTools includes a built-in **Hover Provider** that instantly gives you the underlying code context of any step.

## 🚀 How it Works

When you hover your mouse cursor over any step (e.g., `Given`, `When`, `Then`) in a `.feature` file, the extension parses your workspace in real-time and displays a rich tooltip.

### 1. Python Signature Extraction
The tooltip displays the exact Python function signature (`def step_impl(context, ...):`) that matches your step. It supports single-line and complex multi-line function declarations.

### 2. Docstring Parsing
If your Python developer left a docstring (`"""..."""` or `'''...'''`) explaining what the step does, the Hover Provider will extract it and render it cleanly inside the tooltip using Markdown.

### 3. Tag Blast Radius
Hovering over any Gherkin tag (e.g., `@regression`) instantly calculates its "Blast Radius". The tooltip dynamically counts and displays the total number of executable scenarios affected by that tag across the entire workspace. This fully supports tag inheritance (from `Feature` or `Rule` levels) and multiplies data rows within `Scenario Outline` tables.

## 💡 Usage Example

Imagine you have the following Python code in your `steps.py`:

```python
@given('the user enters valid credentials')
def step_when_user_enters_credentials(
    context,
    username,
    password
):
    """
    Simulates a user typing their credentials into the login form.
    It automatically bypasses CAPTCHA in the test environment.
    """
    pass
```

When you hover over `Given the user enters valid credentials` in your `.feature` file, you will instantly see a formatted popup showing:

> [!NOTE]
> **def step_when_user_enters_credentials(context, username, password):**
>
> ---
> Simulates a user typing their credentials into the login form.
> It automatically bypasses CAPTCHA in the test environment.

## ⚙️ Requirements
- Ensure your step definitions are written in Python using Behave decorators (`@given`, `@when`, `@then`, `@step`).
- Docstrings must immediately follow the `def` statement.
