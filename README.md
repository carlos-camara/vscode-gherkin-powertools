# Gherkin Beautifier for Visual Studio Code

<p align="center">
  <img src="./assets/logo.png" width="128" alt="Gherkin Beautifier Logo">
</p>

<p align="center">
  <img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-1.80+-blue?style=for-the-badge&logo=visualstudiocode">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.1-blue?style=for-the-badge&logo=typescript">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
</p>

**Gherkin Beautifier** is a highly professional, native formatting extension for Visual Studio Code, meticulously designed for QA Engineers, SDETs, and BDD practitioners. It instantly transforms chaotic, misaligned `.feature` files into perfectly structured, beautifully aligned, and readable living documentation.

---

## 🌟 Key Features

1. **Native VS Code Integration**: Hooks directly into the formatting API. Use `Shift+Alt+F` to format the whole document, or `Cmd+K Cmd+F` (`Ctrl+K Ctrl+F` on Windows) to format only a specific selection of text.
2. **Deep Table Alignment Algorithm**: Automatically calculates the maximum width of every column in your Step Data Tables and `Examples:` tables, applying precise padding so that every `|` aligns vertically. 
3. **Keyword-Relative Table Indentation**: Instead of fixed spacing, tables automatically detect the length of their preceding keyword (`Given`, `When`, `Then`) and perfectly align their left border with the first letter of your step description.
4. **Auto-Casing**: Normalizes the capitalization of all keywords (`feature` -> `Feature`, `when` -> `When`, etc.), ensuring uniform standards across your `.feature` files regardless of how they were typed.
5. **Tag Sorting & Wrapping**: Automatically sorts multiple tags alphabetically (`@smoke @api` -> `@api @smoke`) and wraps them cleanly if they exceed 80 characters in length.
6. **Smart Whitespace Cleanup**: Automatically collapses multiple sequential empty lines down to a single line, and instantly trims all trailing whitespace to keep your git commits clean.
4. **Smart Block Spacing**: Automatically ensures exactly one breathable blank line before major BDD blocks (`Scenario`, `Scenario Outline`, `Background`, `Rule`, `@tags`), preventing walls of text.

---

## 🛠️ Architecture & Workflow

For a detailed technical deep-dive into the formatter engine, including UML class diagrams and execution flowcharts, please refer to the **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** document.

The extension is designed around a fast, memory-efficient line-parsing engine. All the technical diagrams and workflows have been moved to the `ARCHITECTURE.md` file to ensure full compatibility with the VS Code extension marketplace rendering engine.

---

## 📖 Deep Dive: Formatting Rules

### 1. Strict Semantic Indentation
The engine applies standard Gherkin indentation rules:
* `Feature:` ➜ 0 spaces
* `Rule:`, `Background:`, `Scenario:`, `@tags` ➜ 2 spaces
* `Examples:`, `Given`, `When`, `Then`, `And`, `But`, `*` ➜ 4 spaces
* `"""` DocStrings ➜ 6 spaces
* Comments (`#`) ➜ Aligns with the enclosing block (2 spaces).

### 2. Keyword-Relative Table Alignment
Data tables visually anchor themselves to the text of the preceding step. 

```gherkin
    # Notice how the table aligns with the "I" in "I enter"
    When I enter my credentials
         | username | password |
         | admin    | secret   |
```

---

## 🚀 Comprehensive Example

### Before Formatting (Chaotic & Unreadable)

```gherkin
Feature: User Authentication
@regression @login
Scenario: Login with multiple user roles
Given the system is running
  When    I navigate to the login page
And I enter my credentials
|role|username|password|expected_status|
|admin|admin_user|super_secret_123|success|
|guest|guest_user|1234|failure|
|locked_out_user|locked|abc|locked|
 Then I should see the appropriate dashboard
```

### After Formatting (`Shift+Alt+F`)

```gherkin
Feature: User Authentication

  @regression @login
  Scenario: Login with multiple user roles
    Given the system is running
    When I navigate to the login page
    And I enter my credentials
        | role            | username   | password         | expected_status |
        | admin           | admin_user | super_secret_123 | success         |
        | guest           | guest_user | 1234             | failure         |
        | locked_out_user | locked     | abc              | locked          |
    Then I should see the appropriate dashboard
```

---

## ⚙️ Installation

### From Marketplace (Recommended)
1. Open Visual Studio Code.
2. Go to the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Search for **"Gherkin Beautifier"**.
4. Click **Install**.

### Manual Installation (.vsix)
If you want to use the extension locally without publishing it:
1. Ensure you have the packaged `.vsix` file.
2. Open VS Code and go to the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Click the `...` (Views and More Actions) menu in the top right of the Extensions view.
4. Select **"Install from VSIX..."**
5. Locate and select the `vscode-gherkin-beautifier-1.4.0.vsix` file.

### Settings
*(Optional)* Add the following to your `settings.json` to format automatically on save:
   ```json
   "[feature]": {
       "editor.formatOnSave": true
   }
   ```

## ⚙️ Configuration Settings

You can fully customize the behavior of the formatter in your VS Code `settings.json`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `gherkinBeautifier.indentation.steps` | `number` | `4` | Number of spaces to indent steps (`Given`, `When`, `Then`, `Examples`, etc). Change to `2` if you prefer tighter code. |
| `gherkinBeautifier.tables.alignToKeyword` | `boolean` | `true` | If `true`, tables align dynamically to the start of the step text. If `false`, tables simply indent slightly more than the step keyword. |

## 🤝 Contributing
We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to set up the repository locally, run the tests, build the `.vsix` from source, and submit Pull Requests.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
