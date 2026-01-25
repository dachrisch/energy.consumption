# Implementation Plan: Mobile-Responsive Bottom Navigation

## Phase 1: Test Setup & Navigation Verification
- [x] Task: Create a regression test for mobile navigation.
    - [x] Write a Playwright test to verify that the bottom nav is visible on mobile and hidden on desktop.
    - [x] Verify that current links in `BottomNav` work.
- [x] Task: TDD - Add test cases for the new "Add Reading" destination and prominent styling check.

## Phase 2: Bottom Navigation Refactoring
- [x] Task: Update `navItems` in `src/components/BottomNav.tsx`.
    - [x] Change "Add" destination from `/meters/add` to `/add-reading`.
    - [x] Remove "Contracts" from the mobile bottom bar to focus on core "Quick Ops" as per spec.
- [x] Task: Implement prominent "Add Reading" button styling.
    - [x] Refactor the `For` loop or add special handling for the "Add Reading" button.
    - [x] Apply "FAB-style" styling (e.g., elevated, larger, distinctive background).
- [x] Task: Ensure active state highlighting works correctly for all routes.

## Phase 3: Responsive Refinement
- [x] Task: Audit `src/components/Navigation.tsx`.
    - [x] Ensure the Top AppBar navigation links are consistently hidden on mobile viewports.
- [x] Task: Adjust layout padding in `src/App.tsx`.
    - [x] Ensure the `main` content doesn't get obscured by the bottom nav (check for `pb-safe` and sufficient bottom padding).

## Phase 4: Quality Assurance & Finalization
- [x] Task: Execute full unit and integration test suite.
- [x] Task: Visual verification of the bottom bar on various mobile device presets via Chrome MCP.
- [x] Task: Perform final linting and type-checking audit.
- [x] Task: Conductor - User Manual Verification 'Mobile-Responsive Bottom Navigation' (Protocol in workflow.md)