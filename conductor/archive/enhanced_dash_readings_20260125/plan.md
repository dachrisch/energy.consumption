# Implementation Plan: Enhanced Dashboard & Reading Management

## Phase 1: API Extensions & Logic
- [ ] Task: Implement Reading deletion and editing in `handler.ts`.
    - [ ] Add DELETE endpoint for `/api/readings/:id`.
    - [ ] Add PUT/PATCH endpoint for `/api/readings/:id`.
- [ ] Task: Refactor `src/lib/consumption.ts` to calculate deltas for a list of readings.
- [ ] Task: TDD - Unit tests for delta calculation and reading update/delete logic.

## Phase 2: Dashboard Summary Cards
- [ ] Task: Update `Dashboard.tsx`.
    - [ ] Re-implement the summary stats logic (currently in MeterDetail) for the dashboard grid cards.
    - [ ] Display Daily Avg, Yearly Proj, and Cost on each meter card.
- [ ] Task: Visual verification of updated dashboard cards via Chrome MCP.

## Phase 3: Reading History View
- [ ] Task: Create the `MeterReadings.tsx` page.
    - [ ] Implement the tabular view with Date, Value, and Delta.
    - [ ] Integrate Edit and Delete inline actions.
- [ ] Task: Implement pagination/infinite scroll for the reading table.
- [ ] Task: Update routing in `src/index.tsx` to include the new readings list path.

## Phase 4: Navigation & Flow Optimization
- [ ] Task: Update `AddReading.tsx`.
    - [ ] Modify the `handleSubmit` redirection to point to the new meter readings list.
- [ ] Task: Audit and update links in `Navigation.tsx` and `Dashboard.tsx` to point to the correct detail and history views.

## Phase 5: Quality Assurance & Finalization
- [ ] Task: Execute full unit and integration test suite.
- [ ] Task: Perform final linting and type-checking audit.
- [ ] Task: Visual verification of the new redirection and CRUD flow via Chrome MCP.
- [ ] Task: Conductor - User Manual Verification 'Enhanced Dashboard & Reading Management' (Protocol in workflow.md)
