# Implementation Plan - Monthly Consumption Projections

## Phase 1: Projection Logic (Backend)
- [ ] Task: Implement core projection utility
    - [ ] Write unit tests for daily average calculation
    - [ ] Implement daily average calculation logic
    - [ ] Write unit tests for seasonal weighting
    - [ ] Implement seasonal weighting logic
- [ ] Task: Integrate contract pricing into projections
    - [ ] Write tests for cost estimation based on projected units
    - [ ] Implement cost estimation logic
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Projection Logic (Backend)' (Protocol in workflow.md)

## Phase 2: API & Service Layer
- [ ] Task: Create Projection Service
    - [ ] Write integration tests for ProjectionService
    - [ ] Implement ProjectionService to aggregate data for a user
- [ ] Task: Expose Projections via API
    - [ ] Write tests for the projection API endpoint/action
    - [ ] Implement API route/action to return projection data
- [ ] Task: Conductor - User Manual Verification 'Phase 2: API & Service Layer' (Protocol in workflow.md)

## Phase 3: Dashboard Visualization
- [ ] Task: Create ProjectionCard component
    - [ ] Write component tests for ProjectionCard (UI states)
    - [ ] Implement ProjectionCard with basic metrics (Est. Bill, Projected Usage)
- [ ] Task: Integrate Projection Chart
    - [ ] Write tests for chart data mapping
    - [ ] Implement visual comparison of actual vs. projected usage using Chart.js
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dashboard Visualization' (Protocol in workflow.md)

## Phase 4: Final Verification
- [ ] Task: End-to-End Testing
    - [ ] Write E2E tests for the full projection workflow
    - [ ] Verify projections update correctly after adding a new reading
- [ ] Task: Visual Polish and Accessibility
    - [ ] Verify responsive behavior using Chrome MCP
    - [ ] Ensure WCAG 2.1 compliance for new UI elements
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification' (Protocol in workflow.md)
