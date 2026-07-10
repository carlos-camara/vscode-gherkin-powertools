# 🌳 Outline Provider

Navigate massive `.feature` files with ease using VS Code's native **Outline** panel. Powered by the `@cucumber/gherkin` AST Parser, the Outline faithfully represents the exact semantic structure of your Gherkin document.

Unlike regex-based parsers, our AST implementation guarantees it will never get confused by keywords hidden inside comments, docstrings, or data tables.

> [!TIP]
> **How to Access**
>
> 1. Open any `.feature` file in your workspace.
> 2. Open the **Outline** panel (in the left Explorer sidebar) or press `Cmd+Shift+O` / `Ctrl+Shift+O`.
> 3. Click any item in the tree to jump directly to it.

---

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
