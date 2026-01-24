# Implementation Plan: UI Design & App Framing

## Phase 1: Core App Layout & Framing
- [x] Task: Create a Global Layout wrapper in `src/App.tsx`.
    - [ ] Implement the desktop "Global Card" container with centering and width constraints (max-1400px).
    - [ ] Apply consistent page background and card shadows.
- [x] Task: TDD - Verify layout structure.
    - [ ] Add a Vitest test to ensure the layout wrapper renders and contains the expected CSS classes for centering.

## Phase 2: AppBar & Profile Menu
- [x] Task: Implement the `AppBar` component.
    - [ ] Add "EnergyMonitor" branding.
    - [ ] Implement the DaisyUI Avatar Dropdown for the User Profile.
    - [ ] Add "Logout" functionality to the dropdown.
- [x] Task: Integrate Desktop Navigation in the `AppBar`.
    - [ ] Add links for Dashboard, Meters, Readings, and Contracts (hidden on mobile).
- [x] Task: Visual verification of AppBar via Chrome MCP.

## Phase 3: Responsive Navigation (Mobile)
- [x] Task: Implement the `BottomNav` component.
    - [ ] Add icons and labels for core modules.
    - [ ] Apply fixed positioning to the bottom of the viewport (visible only on mobile).
- [x] Task: Ensure active route highlighting in both AppBar and BottomNav.
- [x] Task: Visual verification of mobile navigation via Chrome MCP.

## Phase 4: Standardized Spacing & Component Audit
- [x] Task: Audit and update existing pages for spacing consistency.
    - [ ] Apply standardized `gap-6` to main page containers.
    - [ ] Wrap page content in consistent Card components where appropriate.
- [x] Task: Touch target optimization.
    - [ ] Ensure all buttons and form inputs meet the 44x44px minimum.
- [x] Task: Final visual regression check across all pages (Dashboard, Meters, Add reading).

## Phase 5: Quality Assurance & Finalization
- [x] Task: Execute full unit and integration test suite.
- [x] Task: Perform final linting and type-checking audit.
- [x] Task: Conductor - User Manual Verification 'UI Design & App Framing' (Protocol in workflow.md)
