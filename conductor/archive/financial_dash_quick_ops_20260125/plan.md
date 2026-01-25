# Implementation Plan: Unified Financial Dashboard & Quick Operations

## Phase 1: Route Reorganization & Navigation
- [x] Task: Create the new `/meters` route.
    - [x] Move the existing meter grid logic from `Dashboard.tsx` to `Meters.tsx`.
- [x] Task: Update routing in `src/index.tsx`.
    - [x] Link `/dashboard` to the new Aggregated Dashboard component.
    - [x] Link `/meters` to the new Meters component.
- [x] Task: Update `AppBar` and `BottomNav`.
    - [x] Add "Meters" link and ensure correct active highlighting.
- [x] Task: TDD - Verify route availability.

## Phase 2: Aggregated Data Logic
- [x] Task: Extend API `handler.ts`.
    - [x] Add `/api/aggregates` endpoint to calculate total projected costs per source.
- [x] Task: Update `src/lib/pricing.ts` or create `src/lib/aggregates.ts`.
    - [x] Implement summation logic for Power and Gas projections.
- [x] Task: TDD - Unit tests for aggregation logic.

## Phase 3: Financial Cockpit (Dashboard)
- [x] Task: Implement the new `Dashboard.tsx` layout.
    - [x] Create the "Total Energy Cost" card with Power/Gas breakdown.
    - [x] Add the "Quick Add Reading" button to the header.
- [x] Task: Visual verification via Chrome MCP.

## Phase 4: Quick Add Reading Enhancements
- [x] Task: Refactor `AddReading.tsx`.
    - [x] Implement the meter selection dropdown.
    - [x] Add logic to default to the last used meter (using localStorage or session state).
- [x] Task: Ensure direct meter context navigation (from meter list) still pre-selects the correct meter.
- [x] Task: Visual verification of the new form flow.

## Phase 5: Quality Assurance & Finalization
- [x] Task: Execute full unit and integration test suite.
- [x] Task: Perform final linting and type-checking audit.
- [x] Task: Conductor - User Manual Verification 'Unified Financial Dashboard & Quick Operations' (Protocol in workflow.md)
