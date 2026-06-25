# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-06-24
### Added
- **Auto-Casing**: Formatter now automatically PascalCases Gherkin keywords (`Given`, `When`, `Then`, `Feature`, etc.) regardless of user input.
- **Tag Sorting**: The formatter now alphabetizes tags (e.g. `@smoke @login` becomes `@login @smoke`).
- **Tag Wrapping**: If a list of tags exceeds 80 characters, it will automatically wrap to the next line with correct 2-space indentation.
- **Whitespace Cleanup**: Added logic to collapse 2+ consecutive empty lines into a single empty line.
- **Trailing Whitespace Removal**: Formatter now aggressively trims trailing whitespaces on all lines to prevent dirty git commits.
- **Variable Normalization**: Automatically trims useless spaces inside `Scenario Outline` variables (e.g. `< user name >` becomes `<user name>`) to prevent runner failures.

## [1.3.0] - 2026-06-24
### Added
- **Configuration Settings**: Added support for customizing the formatter via `settings.json`.
  - `gherkinBeautifier.indentation.steps`: Allows changing step indentation (e.g. from 4 to 2 spaces).
  - `gherkinBeautifier.tables.alignToKeyword`: Allows toggling the dynamic table alignment behavior.

## [1.2.0] - 2026-06-24
### Added
- **Format Selection Support**: Implemented `DocumentRangeFormattingEditProvider`. Now you can highlight a specific block of text (like a single table) and format only that section without touching the rest of the file using `Cmd+K Cmd+F` (`Ctrl+K Ctrl+F`).

## [1.1.0] - 2026-06-24
### Added
- **Smart Block Spacing**: Automatically ensures exactly one blank line before major blocks (Scenarios, Rules, Backgrounds, Tags).
- **Dynamic Table Alignment**: Tables now automatically inherit the exact indentation level of their preceding keyword.

## [1.0.0] - 2026-06-24
### Added
- Initial release.
- Core Gherkin indentation formatting engine.
- Intelligent data table alignment algorithm.
- Integration with VS Code `DocumentFormattingEditProvider`.
