<!-- markdownlint-disable MD041 MD033 -->

<div align="center">

<h1>Gherkin PowerTools</h1>
<img src="./assets/logo-transparent.png" alt="Gherkin PowerTools Logo" width="250" /><br/>
<a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">
  <img src="https://img.shields.io/badge/Install%20from%20VS%20Code%20Marketplace-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Install Extension" />
</a>
<br/><br/>
<p><strong>The Ultimate VS Code Extension for Writing, Formatting, and Linting BDD Feature Files</strong></p>

<a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">
  <img src="https://vsmarketplacebadges.dev/version/carloscamara.vscode-gherkin-powertools.svg?style=for-the-badge&color=007ACC" alt="Marketplace Version" />
</a>
<a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">
  <img src="https://vsmarketplacebadges.dev/installs/carloscamara.vscode-gherkin-powertools.svg?style=for-the-badge&color=28A745" alt="Installs" />
</a>
<a href="https://marketplace.visualstudio.com/items?itemName=carloscamara.vscode-gherkin-powertools">
  <img src="https://vsmarketplacebadges.dev/downloads/carloscamara.vscode-gherkin-powertools.svg?style=for-the-badge&color=8A2BE2" alt="Downloads" />
</a>
<img src="https://img.shields.io/badge/VS%20Code-%5E1.93.0-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="VS Code 1.93.0+" />

<br/>

![Gherkin PowerTools Highlight Demo](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/highlighting.gif)

</div>

---

## ⚡ Supercharge Your BDD Workflow

Are you tired of manually aligning Markdown data tables, hunting for missing colons, or pushing syntax typos that break your CI/CD pipelines?

**Gherkin PowerTools** transforms Visual Studio Code into an enterprise-grade IDE for Behavior-Driven Development (BDD). Whether you're an SDET, a QA Engineer, or a Developer writing Acceptance Tests, this extension eliminates the friction of writing `.feature` files.

Provides **universal formatting and linting** for any framework (Cucumber, Playwright BDD, SpecFlow, Karate), with deep navigation and autocomplete supercharged specifically for **Python/Behave**.

### 🌟 Why Install This Extension?

- **Save Hours of Formatting:** Stop aligning pipes (`|`) by hand. Press `Format Document` and watch your entire file align perfectly.
- **Zero-Configuration Linting:** Catch syntax errors in real-time before you commit.
- **Python/Behave Superpowers:** Jump directly from Gherkin steps to Python definitions with `Cmd+Click`.
- **Lightning Fast:** Built natively for VS Code using the official `@cucumber/gherkin` AST parser. It won't slow down your editor.

---

## 🔥 Feature Showcase

### 🧹 Pixel-Perfect Table Auto-Alignment
**Stop wrestling with spaces.** Hit save, and let Gherkin PowerTools instantly align your data tables and wrap your tags to perfection. Keep your focus on testing, not formatting.

<div align="center">

![Formatting Data Tables](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/formatter.gif)<br/>
**📖 Read the full documentation on [Formatter](https://carlos-camara.github.io/vscode-gherkin-powertools/features/formatter.html)**

</div>

### 🛡️ Real-Time Syntax Guardian
**Catch typos before they break your build.** Our strict, real-time AST linter silently watches your back, highlighting missing colons and malformed tables exactly when you type them. Shift-left your BDD workflow today.

<div align="center">

![Linting and Diagnostics](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/linter.gif)<br/>
**📖 Read the full documentation on [Linter](https://carlos-camara.github.io/vscode-gherkin-powertools/features/linter.html)**

</div>

### 🪄 One-Click Auto-Corrections
**Don't break your typing flow.** Misspelled a keyword? Forgot punctuation? Just hit `Cmd+.` and let intelligent auto-corrections fix your Gherkin syntax in a fraction of a second.

<div align="center">

![One-Click Auto-Corrections](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/auto-corrections.gif)<br/>
**📖 Read the full documentation on [Auto-Corrections](https://carlos-camara.github.io/vscode-gherkin-powertools/features/linter.html#auto-corrections)**

</div>

### 🧠 Smart Autocompletion (IntelliSense)
**Type less, test more.** Forget memorizing exact step definitions. The extension parses your Python codebase and offers context-aware IntelliSense for your Gherkin steps, complete with interactive Tab-to-Fill variables.

<div align="center">

![IntelliSense Demonstration](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/completion.gif)<br/>
**📖 Read the full documentation on [Autocomplete & Snippets](https://carlos-camara.github.io/vscode-gherkin-powertools/features/snippets.html)**

</div>

### 💥 Intelligent Hover Tooltips
**Context at your fingertips.** Hover over any Gherkin `@tag` to instantly see its "Blast Radius" (how many scenarios across the workspace it impacts). Hover over any step to reveal its exact Python function signature and docstrings without leaving the feature file!

<div align="center">

![Hover on Tags](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/hover-tags.gif)<br/>
**📖 Read the full documentation on [Hover Preview](https://carlos-camara.github.io/vscode-gherkin-powertools/features/hover.html)**

</div>

### 🐍 Seamless Python Step Navigation
**Navigate your test suite at the speed of thought.** Cmd-Click any Gherkin step to instantly jump to its Python definition, trigger context-aware autocomplete, or hover to read the underlying code without ever switching tabs.

<div align="center">

![Go To Definition for Behave](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/goto-definition.gif)<br/>
**📖 Read the full documentation on [Go To Definition](https://carlos-camara.github.io/vscode-gherkin-powertools/features/definition.html)**

</div>

### 🗺️ Outline Provider & Structure Navigation
**Never get lost in massive feature files.** The AST-powered outline perfectly mirrors your file's semantic structure (Features, Rules, Scenarios), letting you instantly navigate massive test suites.

<div align="center">

![Outline Provider Demo](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/outline.gif)<br/>
**📖 Read the full documentation on [Outline Provider](https://carlos-camara.github.io/vscode-gherkin-powertools/features/outline.html)**

</div>

### 📈 Project Health Dashboard
**Understand your testing surface at a glance.** Generate heuristic analytics to visualize tag distribution, pinpoint overgrown scenarios, and measure your total QA effort right from your editor.

<div align="center">

![Project QA Statistics Dashboard](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/dashboard.gif)<br/>
**📖 Read the full documentation on [Statistics Dashboard](https://carlos-camara.github.io/vscode-gherkin-powertools/features/statistics.html)**

</div>

---

## 🏆 How It Compares

Why use Gherkin PowerTools over the Official Cucumber extension? **Ergonomics and Precision.**

| Feature | Gherkin PowerTools 🚀 | Official Cucumber |
|---------|-----------------------|-------------------|
| **Table Alignment** | Dynamic alignment to step keywords | Basic internal alignment |
| **Linter Engine** | Strict structural AST checks | Syntax & undefined steps |
| **Code Auto-Fixes** | Typo correction, auto-punctuation | Snippet generation only |
| **Behave Navigation**| Deep Python AST Integration | Generic Language Server |
| **QA Dashboard** | Built-in Graphical Metrics | ❌ None |

*We highly recommend installing Gherkin PowerTools **alongside** the Official Cucumber extension to get the best of both worlds (advanced formatting + deep Language Server support).*

---

## 🚀 Installation

For detailed installation instructions and troubleshooting, see the [Full Installation Guide](https://carlos-camara.github.io/vscode-gherkin-powertools/installation.html).

<div align="center">

![Installation Demonstration](https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/install.gif)

</div>

### 🚀 Quick Start

1. Install **Gherkin PowerTools** from the VS Code Marketplace.
2. Open any `.feature` file.
3. Start typing! Formatting and linting work immediately out of the box.

### Recommended Settings

Add this to your `settings.json` to enable **Format on Save**:

```jsonc
"[feature]": {
  "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
  "editor.formatOnSave": true
}
```

### Essential Shortcuts

| Action | macOS | Windows / Linux |
|--------|-------|-----------------|
| **Format Document** | `⇧ ⌥ F` | `Shift + Alt + F` |
| **Quick Fix** | `⌘ .` | `Ctrl + .` |
| **Go To Definition** | `⌘ Click` | `Ctrl + Click` |
| **Trigger Autocomplete** | `^ Space` | `Ctrl + Space` |

---

## ⚙️ Configuration Options

Fine-tune the extension to match your team's style guide via your Workspace Settings:

| Setting | Default | Description |
|---------|:-------:|-------------|
| `gherkinPowerTools.indentation.steps` | `4` | Number of spaces to indent steps. |
| `gherkinPowerTools.tables.alignToKeyword` | `true` | Align pipes dynamically to the step text. |
| `gherkinPowerTools.tags.format` | `"wrap"` | `"wrap"` or `"singleLine"` for long tags. |
| `gherkinPowerTools.behave.stepGlobs` | `["**/steps/**/*.py"]` | Paths to index your Python steps. |



## 🗺️ Roadmap & Support

We are actively developing new features to make this the ultimate BDD toolkit.
* Upcoming: Native support for **Playwright BDD** step navigation.
* Upcoming: **Cypress** integration.

Found a bug or have a feature request? Let us know on [GitHub Issues](https://github.com/carlos-camara/vscode-gherkin-powertools/issues).

---

## 🤝 Contributing & License

Gherkin PowerTools is Open Source. We welcome contributions from the community! Check out our [Contributing Guide](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/CONTRIBUTING.md) to get started.

This project is licensed under the [MIT License](https://github.com/carlos-camara/vscode-gherkin-powertools/blob/main/LICENSE) - © [Carlos Camara](https://github.com/carlos-camara).
