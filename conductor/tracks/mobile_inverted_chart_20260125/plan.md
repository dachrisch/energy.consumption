# Implementation Plan: Mobile-Responsive Inverted Chart View

## Phase 1: Foundation & Test Setup
- [x] Task: Audit `src/components/ConsumptionChart.tsx`.
    - [x] Analyze how Chart.js is currently configured and how data is passed.
- [x] Task: Create a regression/unit test for chart responsiveness.
    - [x] Write a test that verifies the detection of the 768px breakpoint.
    - [x] Ensure it correctly identifies the required chart configuration (standard vs. inverted).

## Phase 2: Core Logic - Inverted Configuration
- [x] Task: TDD - Implement Inverted Chart Configuration logic.
    - [x] Create a utility function to generate Chart.js options for an inverted Y-axis (Time) and X-axis (Amount).
    - [x] Implement the "Oldest at Top" sorting logic for the Y-axis.
    - [x] Verify via unit tests that the axes are correctly swapped in the config object.

## Phase 3: Component Refactoring
- [x] Task: Update `ConsumptionChart.tsx` for responsive rendering.
    - [x] Implement a `createMemo` or similar reactive signal to track window width.
    - [x] Add conditional logic to switch between standard and inverted Chart.js instances (or update the configuration dynamically).
    - [x] Style the inverted chart to ensure it utilizes vertical space effectively within the Global Card.

## Phase 4: Layout & UI Integration
- [x] Task: Audit Dashboard and Meter Detail layouts.
    - [x] Ensure the container height is flexible on mobile to accommodate the vertically growing inverted chart.
    - [x] Verify the "Total Consumption" summary label visibility above the chart area.
- [x] Task: Visual verification via Chrome MCP.
    - [x] Test on various mobile device presets (iPhone, Pixel).
    - [x] Verify smooth transition when resizing from desktop to mobile.

## Phase 5: Final Quality Audit
- [ ] Task: Execute full unit and integration test suite.
- [ ] Task: Perform final linting and type-checking audit.
