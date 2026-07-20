# Behave Execution

Gherkin PowerTools allows you to execute your Behave tests directly from the editor without switching to the terminal.

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/run-debug.gif" alt="Execute Scenarios via CodeLens" width="600" />
</div>

## Run Feature and Run Scenario CodeLens

Above every `Feature`, `Scenario`, and `Scenario Outline` in your `.feature` files, you will see three CodeLens buttons:
- `▶ Run Feature` (or Scenario)
- `🐞 Debug`
- `✎ Edit`

### `▶ Run`

Clicking the **Run** button will:
1. Open a dedicated terminal panel named **Behave**.
2. Construct the Behave execution command using your configured `command` (defaults to `behave`).
3. Execute the specific feature or scenario exactly where you clicked.

> **Note:** When running a scenario, the extension passes the exact line number of the scenario to Behave (e.g. `behave "features/login.feature:12"`), ensuring that only that scenario runs.

### `✎ Edit` (Persistent Arguments)

Sometimes you want to pass extra flags to Behave during a quick testing session, such as `--tags=@wip` or `--no-capture`.

Clicking the **Edit** button will:
1. Open a command palette input box pre-filled with the exact command the extension is about to run.
2. Allow you to manually add parameters anywhere in the string (e.g., adding `-D env=test` or `--no-capture`).
3. Save your customized arguments globally for the session so that you can execute them by clicking **Run** or **Debug** on any scenario.

**✨ Smart Persistence:** During your VS Code session, Gherkin PowerTools will remember any extra arguments you added! The next time you click **Run**, **Debug**, or **Edit**, your previous arguments will automatically be included in the command. If you want to clear them, simply click **Edit** again and remove them.

### `🐞 Debug`

Clicking the **Debug** button allows you to visually debug Python step definitions for the specific scenario.

When you click **Debug**:
1. The extension constructs a temporary debugging configuration for Behave.
2. It launches Behave using the official VS Code Python debugger (`ms-python.python`).
3. Execution pauses at any breakpoints you have placed in your Python step definitions, allowing you to inspect variables and step through code.

> **Important:** The debug button requires the **Python extension** (`ms-python.python`) to be installed in VS Code. It uses your workspace's configured Python interpreter and correctly handles any arguments defined in `additionalArguments` or via `Edit`.

#### Debugging Limitations

- **Scenario Outlines**: Debugging specific examples within a `Scenario Outline` using the line number relies on Behave's name-matching fallback behavior if line number resolution is disabled in Behave or if the debugger strips the line number.
  Due to Behave's runner logic, if you have multiple scenarios with the exact same name across different feature files (or identical examples), the debugger might execute all matching scenarios instead of just the one selected.
  To avoid this, ensure your scenarios have unique names.
- **Rule Backgrounds**: If the scenario is inside a `Rule`, Behave's execution engine might exhibit similar grouping behaviors when launched via a debug adapter.

## Configuration

You can customize the execution behavior using the following settings:

### `gherkinPowerTools.behave.command`
The base command used to run Behave. If you use a virtual environment, `pipenv`, or `poetry`, you can change this to suit your project (e.g., `poetry run behave` or `pipenv run behave`).
* **Type:** `string`
* **Default:** `"behave"`

### `gherkinPowerTools.behave.additionalArguments`
If you want to pass extra flags to Behave permanently across all sessions (like `--format progress`), you can add them to this array.
* **Type:** `array` of `string`
* **Default:** `[]`
* **Example:** `["--no-capture", "--tags", "@wip"]`

---

**Example `.gherkin-powertoolsrc.json` Configuration:**

```json
{
    "behave": {
        "command": "poetry run behave",
        "additionalArguments": ["--no-capture"]
    }
}
```
