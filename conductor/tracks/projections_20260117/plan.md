# Implementation Plan - Monthly Consumption Projections

## Phase 1: Projection Logic (Backend)
- [x] Task: Implement core projection utility
    - [x] Write unit tests for daily average calculation
    - [x] Implement daily average calculation logic
    - [x] Write unit tests for seasonal weighting
    - [x] Implement seasonal weighting logic
- [x] Task: Integrate contract pricing into projections
    - [x] Write tests for cost estimation based on projected units
    - [x] Implement cost estimation logic
- [x] Task: Conductor - User Manual Verification 'Phase 1: Projection Logic (Backend)' (Protocol in workflow.md)

## Phase 2: API & Service Layer
- [x] Task: Create Projection Service
    - [x] Write integration tests for ProjectionService
    - [x] Implement ProjectionService to aggregate data for a user
- [x] Task: Expose Projections via API
    - [x] Write tests for the projection API endpoint/action
    - [x] Implement API route/action to return projection data
- [x] Task: Conductor - User Manual Verification 'Phase 2: API & Service Layer' (Protocol in workflow.md)

## Phase 3: Dashboard Visualization
- [x] Task: Create ProjectionCard component
    - [x] Write component tests for ProjectionCard (UI states)
    - [x] Implement ProjectionCard with basic metrics (Est. Bill, Projected Usage)
- [x] Task: Integrate Projection Chart
    - [x] Write tests for chart data mapping
    - [x] Implement visual comparison of actual vs. projected usage using Chart.js
- [x] Task: Conductor - User Manual Verification 'Phase 3: Dashboard Visualization' (Protocol in workflow.md)

## Phase 4: Final Verification
- [x] Task: End-to-End Testing
    - [x] Write E2E tests for the full projection workflow
    - [x] Verify projections update correctly after adding a new reading
- [x] Task: Visual Polish and Accessibility
    - [x] Verify responsive behavior using Chrome MCP
    - [x] Ensure WCAG 2.1 compliance for new UI elements
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Verification' (Protocol in workflow.md)
