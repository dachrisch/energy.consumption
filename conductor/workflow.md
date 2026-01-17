# Project Workflow - Energy Consumption Monitor

## Development Methodology
- **Test-Driven Development (TDD):** All new features and bug fixes MUST start with a failing test.
- **Iterative Implementation:** Implement the minimum code necessary to pass the test, then refactor.
- **Focused Testing:** During active development, running only relevant tests for the current task is permitted for speed.
- **Regression Checks:** Before requesting user feedback or merging, the complete integration and unit test suites MUST be executed and pass.
- **Visual Verification:** Use the Chrome DevTools MCP to visually inspect and verify all frontend UI features and responsive behaviors.

## Branching & Commit Strategy
- **Branch-Based Development:** All development MUST occur in feature or fix branches.
- **No Direct Commits to Master:** Commits directly to the `master` (or `main`) branch are strictly prohibited.
- **Atomic Task Commits:** Commit changes immediately after the completion of each task in the `plan.md`.
- **Task Summaries:** Record a detailed summary of each task using **Git Notes** to keep the commit history clean while preserving technical context.

## Quality Standards
- **Test Coverage:** Maintain a minimum of **80%** code coverage across the project.
- **Production Readiness:** Code must be linted, type-checked, and verified against regression suites before being considered complete.