# 💡 Intelligent Quick Fixes

Gherkin PowerTools includes a real-time syntax Linter that monitors your document as you type.

When you make a mistake or reference a step that doesn't exist, a **Quick Fix** lightbulb (💡) will appear next to the red underline.

Press `Cmd + .` (macOS) or `Ctrl + .` (Windows/Linux) to see the suggested fixes:
- **Missing colons:** Instantly append a `:` to `Feature` or `Scenario`.
- **Undefined Steps:** Automatically generate a Python stub for missing steps in your `steps/` folder.
- **Wrong blocks:** Instantly convert a `Scenario` into a `Scenario Outline` if you accidentally added an `Examples` table.
