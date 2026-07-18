<!-- markdownlint-disable MD046 -->
# 🚀 Installation

## From the VS Code Marketplace

1. Open Visual Studio Code.
2. Navigate to the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Search for **"Gherkin PowerTools"**.
4. Click **Install**.

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/install.gif" alt="Installation Demonstration" width="800" />
</div>

## From a `.vsix` File

If you have a pre-built `.vsix` package (e.g., from a GitHub Release):

```bash
code --install-extension vscode-gherkin-powertools-<version>.vsix
```

<div align="center">
  <img src="https://raw.githubusercontent.com/carlos-camara/vscode-gherkin-powertools/main/assets/install-vsix.gif" alt=".vsix Installation Demonstration" width="800" />
</div>

<br>

**💡 PRO-TIP: Auto-Formatting** *To unleash the full power of the extension, enable **Format on Save** specifically for Gherkin files:*

```json
"[feature]": {
    "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
    "editor.formatOnSave": true
}
```

*Add this to your `.vscode/settings.json` or your global User Settings.*

<br>
