# Implementation Plan: Constrain Chart to Viewport Width

## Phase 1: Analysis & Reproducing Test
- [x] Task: Audit current styles in `src/components/ConsumptionChart.tsx`.
    - [x] Identify any hardcoded widths or missing responsive classes.
- [x] Task: Create a failing E2E test in Playwright.
    - [x] Write a test that sets the viewport to a small mobile size (e.g., 320px).
    - [x] Verify that the `window.scrollX` is 0 or that the body width matches the viewport width (detecting overflow).

## Phase 2: Implementation of Width Constraints
- [x] Task: Apply CSS constraints to the chart container.
    - [x] Add `max-w-full` and `overflow-hidden` to the wrapper div in `ConsumptionChart.tsx`.
- [x] Task: Verify Chart.js responsive settings.
    - [x] Ensure `responsive: true` and `maintainAspectRatio: false` are active.
    - [x] Check if the `width` and `height` props on the `Line` component (added in a previous track) are interfering with responsiveness.

## Phase 3: Verification & Polish
- [x] Task: Visual verification via Chrome MCP.
    - [x] Verified via Playwright test with explicit width checks.
- [x] Task: Execute full unit and integration test suite.
- [x] Task: Perform final linting and type-checking audit.
