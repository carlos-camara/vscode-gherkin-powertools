# 🌳 Outline Provider

Navigate massive `.feature` files with ease using VS Code's native **Outline** panel. Powered by the `@cucumber/gherkin` AST Parser, the Outline faithfully represents the exact semantic structure of your Gherkin document.

Unlike regex-based parsers, our AST implementation guarantees it will never get confused by keywords hidden inside comments, docstrings, or data tables.

<div style="border-radius: 8px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1px solid #d1d5db;">
  <div style="background: #1f2937; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 16px;">💡</span>
    <span style="color: #f9fafb; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">How to Access</span>
  </div>
  <div style="background-color: #ffffff; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="background: #1f2937; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; line-height: 20px; text-align: center;">1</span>
      <span style="color: #374151; font-size: 13px; padding-top: 2px;">Open any <code style="background:#f3f4f6; padding: 1px 5px; border-radius: 3px; color: #1f2937;">.feature</code> file in your workspace.</span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="background: #1f2937; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; line-height: 20px; text-align: center;">2</span>
      <span style="color: #374151; font-size: 13px; padding-top: 2px;">Open the <strong style="color: #111827;">Outline</strong> panel (Explorer sidebar) or press <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">⌘⇧O</kbd> / <kbd style="background:#f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; padding: 1px 5px; font-size: 11px; color: #1f2937;">Ctrl+Shift+O</kbd>.</span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="background: #1f2937; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; line-height: 20px; text-align: center;">3</span>
      <span style="color: #374151; font-size: 13px; padding-top: 2px;">Click any item in the tree to jump directly to it.</span>
    </div>
  </div>
</div>


<div align="center">
  <img src="../../assets/outline.gif" alt="Outline Provider Demo" width="600" />
</div>


## 🗺️ Hierarchical Structure

The Outline panel displays a perfectly nested hierarchical tree mirroring your BDD specifications:

```text
📁 Feature: User Authentication
  📁 Rule: Login Flow
    📄 Scenario: Valid credentials
    📄 Scenario: Invalid password
  📁 Rule: Registration
    📄 Scenario Outline: New user signup
```

## 🚀 Workflow Benefits

- **Rapid Navigation**: Instantly jump between scenarios and rules without mindless scrolling.
- **Structural Overview**: Get a bird's-eye view of your feature's complexity and coverage at a glance.
- **Breadcrumb Integration**: The semantic hierarchy is automatically injected into VS Code's breadcrumb navigation bar at the top of the editor, keeping you oriented in large files.
