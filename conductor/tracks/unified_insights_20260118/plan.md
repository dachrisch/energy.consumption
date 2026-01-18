# Implementation Plan: Unified Energy Insights UI

## Phase 1: Foundation & Data Layer Refactoring
Goal: Centralize data fetching and calculation logic to eliminate duplication.

- [x] Task: Create unified `useEnergyInsights` hook
    - [x] Define types for unified insights data (history + projections)
    - [x] Write unit tests for data consolidation logic
    - [x] Implement hook to combine `useEnergyData` and `useProjections` logic
- [x] Task: Centralize calculation services
    - [x] Extract interpolation/extrapolation logic from existing components
    - [x] Create a dedicated service/utility for unified consumption analysis
    - [x] Verify calculations with unit tests (Actual vs. Interpolated vs. Projected)

## Phase 2: Core Component Implementation
Goal: Build the unified, contiguous chart and mobile-first data cards.

- [x] Task: Develop `UnifiedEnergyChart` component
    - [x] Write tests for chart data mapping (contiguous timeline)
    - [x] Implement Chart.js configuration with visual distinctions (dashed lines for projections)
    - [x] Add smooth animations for range updates
- [x] Task: Create `InsightsDataCard` component
    - [x] Design mobile-optimized card for displaying point-in-time details
    - [x] Implement responsive layout (grid on desktop, stack on mobile)
    - [x] Write visual tests for mobile responsiveness

## Phase 3: Insights Page Integration
Goal: Assemble the final `/insights` page with integrated filtering.

- [x] Task: Implement `/insights` route and layout
    - [x] Create page structure using existing layout components
    - [x] Integrate `UnifiedEnergyChart` and `InsightsDataCard` list
- [x] Task: Integrate and optimize Filters
    - [x] Connect `RangeSlider` and `EnergyTableFilters` to the unified state
    - [x] Ensure real-time (debounced) chart updates when filters change
- [x] Task: Add Page-level Transitions
    - [x] Implement entry animations and smooth toggling between Power/Gas views

## Phase 4: Quality Assurance & Verification
Goal: Ensure production readiness and adherence to mobile-first standards.

- [x] Task: Full Regression Testing
    - [x] Run complete integration test suite
    - [x] Verify zero regressions in existing Dashboard/Readings views
- [x] Task: Visual Verification (Chrome DevTools MCP)
    - [x] Verify 44px touch targets on mobile view
    - [x] Inspect chart behavior across multiple breakpoints
    - [x] Check dark mode consistency and "contiguous timeline" shading
