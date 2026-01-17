# Implementation Plan - Replace Timeline Slider with Radix UI

## Phase 1: Preparation & Infrastructure
- [x] Task: Project setup
    - [x] Create feature branch `feat/radix-slider-integration`
    - [x] Install Radix UI Slider dependency (`@radix-ui/react-slider`)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Preparation & Infrastructure' (Protocol in workflow.md)

## Phase 2: Core Logic & Mapping
- [ ] Task: Implement Date-to-Slider mapping utility
    - [ ] Write unit tests for date-to-percentage conversion
    - [ ] Implement utility functions to map slider values (0-100) to timestamps
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Core Logic & Mapping' (Protocol in workflow.md)

## Phase 3: Component Implementation
- [ ] Task: Create AccessibleRangeSlider component
    - [ ] Write component tests for initial render and accessibility attributes
    - [ ] Implement Radix UI Slider with dual handles
    - [ ] Apply Tailwind CSS 4 styles matching Material Design aesthetic
- [ ] Task: Refactor SliderVisualization
    - [ ] Separate the background histogram from the interactive handles
    - [ ] Ensure the histogram correctly overlays the new standalone slider track
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Component Implementation' (Protocol in workflow.md)

## Phase 4: State Integration & UX
- [ ] Task: Integrate with Dashboard and History state
    - [ ] Implement debounced update logic for handle drags
    - [ ] Write integration tests for range selection updates
- [ ] Task: Mobile Polish
    - [ ] Verify touch targets (min 44px)
    - [ ] Test drag behavior on mobile viewport using Chrome MCP
- [ ] Task: Conductor - User Manual Verification 'Phase 4: State Integration & UX' (Protocol in workflow.md)

## Phase 5: Final Verification & Cleanup
- [ ] Task: Regression Testing
    - [ ] Run full test suite to ensure no impact on chart rendering or data filtering
- [ ] Task: Documentation Update
    - [ ] Update any component documentation if necessary
- [ ] Task: Merge and Push
    - [ ] Merge to `main` branch
    - [ ] Final visual check on production-like environment
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Final Verification & Cleanup' (Protocol in workflow.md)
