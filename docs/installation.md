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

<div style="margin: 24px 0; border-radius: 8px; border: 1px solid var(--vscode-panel-border, #e2e8f0); background: var(--vscode-textBlockQuote-background, #f8fafc); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="border-left: 5px solid var(--vscode-editorWarning-foreground, #f59e0b); padding: 16px 20px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--vscode-editorWarning-foreground, #f59e0b)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M16 12a4 4 0 0 1-8 0"></path><path d="M9 16h6"></path><path d="M10 20h4"></path></svg>
      <span style="color: var(--vscode-editorWarning-foreground, #d97706); font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px;">Pro-Tip: Auto-Formatting</span>
    </div>
    <div style="color: var(--vscode-editor-foreground, #334155); font-size: 14.5px; line-height: 1.6;">
      To unleash the full power of the extension, enable <strong>Format on Save</strong> specifically for Gherkin files:
      <pre style="background: var(--vscode-textCodeBlock-background, #1e293b); color: var(--vscode-editor-foreground, #f8fafc); padding: 14px; border-radius: 6px; margin: 12px 0 0 0; overflow-x: auto; border: 1px solid var(--vscode-panel-border, #334155); font-size: 13.5px;"><code>"[feature]": {
    "editor.defaultFormatter": "carloscamara.vscode-gherkin-powertools",
    "editor.formatOnSave": true
}</code></pre>
      <div style="margin-top: 12px;">Add this to your <code>.vscode/settings.json</code> or your global User Settings.</div>
    </div>
  </div>
</div>
