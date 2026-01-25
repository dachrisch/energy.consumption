# Implementation Plan: Profile & Contract Management

## Phase 1: Data Model & API Extensions
- [x] Task: Update the `Contract` MongoDB schema.
    - [ ] Add `providerName` field.
    - [ ] Ensure fields for `startDate`, `endDate`, `basePrice`, `workingPrice`, `meterId`, and `type` are robust.
- [x] Task: Extend API `handler.ts`.
    - [ ] Add GET and POST endpoints for `/api/contracts`.
    - [ ] Implement validation to prevent overlapping contract periods for the same meter.
- [x] Task: TDD - Unit tests for Contract creation and overlap validation.

## Phase 2: UI Implementation - Contracts Page
- [x] Task: Create the `Contracts.tsx` page.
    - [ ] Implement a list view of all existing contracts using DaisyUI cards.
    - [ ] Add an "Add Contract" button leading to a form.
- [x] Task: Implement the `AddContract.tsx` form.
    - [ ] Include fields for provider, dates, pricing, and meter selection.
    - [ ] Apply standardized bold UI styling and 44px touch targets.
- [x] Task: Visual verification of the new pages via Chrome MCP.

## Phase 3: Profile Integration
- [x] Task: Update `AppBar` component in `src/components/Navigation.tsx`.
    - [ ] Fetch and display actual user name and email in the Avatar Dropdown.
- [x] Task: Verify session data is correctly reflected in the UI across page reloads.

## Phase 4: Cost Calculation Engine
- [x] Task: Update `src/lib/pricing.ts`.
    - [ ] Implement a function to find the active contract for a given date and meter.
    - [ ] Refactor `calculateCost` to handle multiple contracts across a consumption period.
- [x] Task: Integrate cost display into `Dashboard` and `MeterDetail` pages.
    - [ ] Show total cost alongside consumption stats.
    - [ ] Update charts to optionally toggle between unit and cost views.

## Phase 5: Quality Assurance & Finalization
- [x] Task: Execute full unit and integration test suite.
- [x] Task: Perform final linting and type-checking audit.
- [x] Task: Visual verification of cost calculations and profile display via Chrome MCP.
- [x] Task: Conductor - User Manual Verification 'Profile & Contract Management' (Protocol in workflow.md)
