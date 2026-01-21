# Implementation Plan: Modern Global Card Layout & Mobile-First UX

## Phase 1: Global Card & Responsive Foundation
- [x] Task: Define fluid typography and global card variables in `globals.css`.
    - [x] Add CSS variables for card max-width (1400px).
    - [x] Implement fluid scale for headings and body text using `clamp()`.
- [x] Task: Implement the Global Card layout in `src/app/layout.tsx`.
    - [x] Wrap the application content in a centered container.
    - [x] Apply 90% responsive width with a 1400px cap.
    - [x] Style the card with appropriate shadows and borders for a modern feel.
- [x] Task: TDD - Verify global card structure.
    - [x] Create a layout test to ensure the card container exists and has correct width constraints.

## Phase 2: Navigation Overhaul
- [x] Task: Create the Mobile Bottom Navigation component.
    - [x] Re-purpose existing icons for a horizontal bottom bar.
    - [x] Ensure touch targets are at least 44x44px.
    - [x] Add fixed positioning to the bottom of the viewport.
- [x] Task: Create the Desktop Top Navigation component.
    - [x] Implement a horizontal nav bar to be placed inside the card header.
    - [x] Clean up redundant sidebar logic.
- [x] Task: Integrate navigation in `LayoutClient.tsx`.
    - [x] Use media queries to switch between Top and Bottom navigation.
    - [x] Verify navigation state and active link highlighting in both views.
- [x] Task: TDD - Verify navigation responsiveness.
    - [x] Add tests to confirm Bottom Nav is visible on mobile and Top Nav is visible on desktop.

## Phase 3: Touch Optimization & Component Audit
- [ ] Task: Global audit of interactive elements for touch accessibility.
    - [ ] Ensure all buttons in forms (`add`, `contracts`) meet the 44px minimum height.
    - [ ] Update input field heights and padding for better touch support.
- [ ] Task: Final CSS cleanup and stability.
    - [ ] Remove any remaining aggressive transitions or scaling effects.
    - [ ] Ensure layout stability when switching focus or hovering.

## Phase 4: Verification & Regression
- [ ] Task: Visual verification using Chrome DevTools MCP.
    - [ ] Inspect mobile layout (375px/390px width) for thumb reachability.
    - [ ] Inspect desktop layout (1440px+) for card centering and proper sizing.
- [ ] Task: Execute full quality check.
    - [ ] Run `npm run type-check`.
    - [ ] Run all tests to ensure no regressions in reading or contract logic.
