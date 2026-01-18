# Track Specification: Unified Energy Insights UI

## Overview
The goal of this track is to create a new, high-quality "Insights" page that intelligently combines historical energy data, real-time analysis, and future projections into a single, cohesive user interface. This involves refactoring existing disparate components and hooks to eliminate duplication and ensure a polished, mobile-first experience.

## User Stories
- As a user, I want a single view where I can see both my past energy usage and my future projections on a continuous timeline.
- As a user, I want the interface to be visually distinct so I can easily tell what is historical data and what is a projection.
- As a user, I want a smooth, responsive experience that works perfectly on my mobile device, with clear details provided in a card-based layout.

## Functional Requirements
- **New Insights Page:** Implement a dedicated `/insights` route.
- **Unified Contiguous Chart:** 
    - Create a chart component that displays historical readings and future projections as a single continuous timeline.
    - Use visual cues (e.g., dashed lines, gradients, or background shading) to differentiate between "Actual" history and "Projected" data.
- **Refactored Data Layer:**
    - Consolidate data fetching into a unified `useEnergyInsights` hook.
    - Centralize interpolation and extrapolation calculation logic.
- **Enhanced UI/UX:**
    - Implement smooth animated transitions for date range changes and energy type toggles.
    - Implement a mobile-first card layout to display specific data points below the chart.
- **Integrated Filtering:** Reuse and optimize the `RangeSlider` and `EnergyTableFilters` for the unified view.

## Non-Functional Requirements
- **Mobile-First Design:** Adhere to the 44px minimum touch target and ensure the layout is fully responsive.
- **Performance:** Ensure smooth chart rendering and efficient data processing for calculations.
- **Code Quality:** Eliminate code duplication by refactoring existing charts and hooks into reusable units.

## Acceptance Criteria
- [ ] A new `/insights` page is accessible and functional.
- [ ] The unified chart displays both historical and projected data seamlessly.
- [ ] Visual distinction between history and projections is clear and matches project styling.
- [ ] All data fetching and calculations are handled by centralized, refactored services/hooks.
- [ ] The UI transitions smoothly and scales correctly for mobile devices.
- [ ] Unit and integration tests cover the new unified logic and components.

## Out of Scope
- Modifying the existing `/dashboard` or `/charts` pages (unless necessary for shared refactoring).
- Implementing new prediction algorithms (use existing extrapolation logic).
