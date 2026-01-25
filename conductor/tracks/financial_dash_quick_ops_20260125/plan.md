# Implementation Plan: Unified Financial Dashboard & Quick Operations

## Phase 1: Route Reorganization & Navigation
- [ ] Task: Create the new `/meters` route.
    - [ ] Move the existing meter grid logic from `Dashboard.tsx` to `Meters.tsx`.
- [ ] Task: Update routing in `src/index.tsx`.
    - [ ] Link `/dashboard` to the new Aggregated Dashboard component.
    - [ ] Link `/meters` to the new Meters component.
- [ ] Task: Update `AppBar` and `BottomNav`.
    - [ ] Add "Meters" link and ensure correct active highlighting.
- [ ] Task: TDD - Verify route availability.

## Phase 2: Aggregated Data Logic
- [ ] Task: Extend API `handler.ts`.
    - [ ] Add `/api/aggregates` endpoint to calculate total projected costs per source.
- [ ] Task: Update `src/lib/pricing.ts` or create `src/lib/aggregates.ts`.
    - [ ] Implement summation logic for Power and Gas projections.
- [ ] Task: TDD - Unit tests for aggregation logic.

## Phase 3: Financial Cockpit (Dashboard)
- [ ] Task: Implement the new `Dashboard.tsx` layout.
    - [ ] Create the "Total Energy Cost" card with Power/Gas breakdown.
    - [ ] Add the "Quick Add Reading" button to the header.
- [ ] Task: Visual verification via Chrome MCP.

## Phase 4: Quick Add Reading Enhancements
- [ ] Task: Refactor `AddReading.tsx`.
    - [ ] Implement the meter selection dropdown.
    - [ ] Add logic to default to the last used meter (using localStorage or session state).
- [ ] Task: Ensure direct meter context navigation (from meter list) still pre-selects the correct meter.
- [ ] Task: Visual verification of the new form flow.

## Phase 5: Quality Assurance & Finalization
- [ ] Task: Execute full unit and integration test suite.
- [ ] Task: Perform final linting and type-checking audit.
- [ ] Task: Conductor - User Manual Verification 'Unified Financial Dashboard & Quick Operations' (Protocol in workflow.md)
