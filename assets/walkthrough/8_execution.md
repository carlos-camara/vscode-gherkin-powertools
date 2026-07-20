# ▶️ Execute Tests from Editor

Stop switching to the terminal. Gherkin PowerTools lets you run your Behave tests with a single click.

Above every `Feature`, `Scenario`, and `Scenario Outline`, you will see **Run** and **Edit** buttons.

- **Run**: Instantly executes the scenario in the dedicated Behave terminal panel.
- **Edit**: Set persistent custom arguments (like `--tags=@wip` or `-D env=test`). These arguments are saved in memory and will be applied to all subsequent executions when you click **Run** during this session.

If you use a virtual environment, `pipenv`, or `poetry`, you can change the base command via the `gherkinPowerTools.behave.command` setting.
