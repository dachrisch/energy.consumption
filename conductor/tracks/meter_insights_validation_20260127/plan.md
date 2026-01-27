# Implementation Plan: Meter Insights & Contract Validation

## Phase 1: Grid Layout & Metric Foundations
- [x] Task: TDD - Update `Meters.tsx` grid layout.
    - [x] Modify Tailwind classes to use `grid-cols-1 md:grid-cols-2` (matching Contracts).
- [x] Task: TDD - Create unit tests for historical interval cost calculation.
    - [x] Test mapping a reading interval (Date A to Date B) against multiple sequential contracts.
    - [x] Test handling of partial coverage within an interval.
- [x] Task: Implement interval-based cost logic in `src/lib/pricing.ts`.
- [x] Task: Update Meter components to display the new "€/day" metric.

## Phase 2: Contract Gap Detection
- [x] Task: TDD - Create unit tests for the gap detection utility.
    - [x] Verify detection of gaps between the first reading and the first contract.
    - [x] Verify detection of gaps between two sequential contracts.
    - [x] Verify detection of gaps between the last contract and the last reading.
- [x] Task: Implement gap detection utility in `src/lib/gapDetection.ts`.
- [x] Task: Integrate gap detection into the `Dashboard` data fetch/processing.
- [x] Task: Add warning indicators to the Meter cards when gaps are present.

## Phase 3: Contract Templates & UI Polish
- [x] Task: TDD - Create component tests for `ContractTemplateCard`.
    - [x] Verify it displays the correct missing date range.
    - [x] Verify the "Add" action pre-fills the creation form.
- [x] Task: Implement `ContractTemplateCard` and integrate it into the `Contracts.tsx` page.
- [x] Task: Visual Verification - Use Chrome DevTools to verify the 2-column grid and warning visibility.

## Phase 4: Finalization & Quality Assurance
- [ ] Task: Run full regression test suite (non-interactive mode).
- [ ] Task: Verify test coverage for new gap logic (target >80%).
- [ ] Task: Final visual polish across mobile and desktop views.
