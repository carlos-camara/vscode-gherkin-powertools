# 📊 Project Analytics Dashboard

Stop flying blind. Get instant, enterprise-grade BDD analytics about your entire project with the **Omega Squeeze** statistics dashboard.

> [!TIP]
> **How to Launch**
>
> - **Right-click** inside any `.feature` file → **Gherkin: Show Project Statistics**
> - Or open the **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`) → **Gherkin: Show Project Statistics**

---

## 🏆 The Gherkin Quality Score (GQS)
The dashboard acts as an automated Quality Auditor for your BDD suite. It calculates a proprietary score from **0 to 100** based on strict BDD best practices:

- **+ Background Reuse**: Earn points for actively using `Background` blocks to eliminate precondition repetition.
- **+ Table Parametrization**: Earn points for using `Scenario Outline` with `Examples` tables to condense testing permutations.
- **+ Documentation Density**: Earn points for having a high ratio of explanatory comments (`#`).
- **- Complexity Penalty**: Lose points if your scenarios are excessively long (penalizes average lengths of >12 steps per scenario).

## 🧠 Scenario Intelligence & Archetypes
- **Scenario Intelligence**: Tracks vocabulary richness, average step conciseness, data density, and actively flags the "Most Complex Scenario" in your suite so you know exactly where to refactor.
- **Behavioral Archetypes**: Scans and classifies your step vocabulary to determine if your project is heavily focused on UI testing, API operations, or Database manipulation.
- **Step Execution Breakdown**: Real-time progress bars charting the exact distribution of `Given`, `When`, `Then`, and `And`/`But` usages across the suite.

## 🚀 Execution & Automation ROI
Stop guessing the value of your automated tests. The dashboard now calculates:

- **Total Executable Tests**: It doesn't just count scenarios. It mathematically calculates every single test permutation by multiplying `Scenario Outline` execution rows.
- **Automation ROI**: Calculates the estimated manual hours saved by your suite every test run (assuming an industry baseline of 5 minutes per manual test execution).

## 🏷️ Tags & Step Intelligence
- **Top Tags Leaderboard**: Scans and indexes every tag in your workspace, displaying an interactive leaderboard of the most frequently used elements (`@smoke`, `@regression`, etc.).
- **Code Density**: Tracks total lines of Gherkin code versus empty formatting lines to monitor file spacing health.

---

## ⚙️ Architecture

The dashboard is rendered as an interactive, fully responsive **HTML Webview** inside VS Code. It features a premium glassmorphism UI built with raw HTML and CSS animations.

When triggered, the extension deeply parses all `.feature` files in the workspace (including unsaved buffers) through the `@cucumber/gherkin` AST, aggregates the data in memory, and paints the dashboard without any external dependencies or telemetry.

### 🔒 Webview Security
Following strict enterprise security standards, the Webview implements a robust Content Security Policy (CSP).
The injected `<meta http-equiv="Content-Security-Policy">` tag completely prevents the execution of inline scripts
(`script-src 'none'`), replacing old script animations with pure CSS equivalents. Furthermore, all dynamic inputs
parsed from the workspace (such as scenario names, tags, and step definitions) are comprehensively sanitized and
HTML-escaped before rendering. This safeguards the editor environment from potential Cross-Site Scripting (XSS)
vectors when rendering external or untrusted `.feature` data.

![Dashboard Demonstration](../assets/dashboard.webp)
