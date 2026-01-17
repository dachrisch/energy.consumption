# Track Specification: Replace Timeline Slider with Radix UI

## Overview
The current custom-built timeline slider is experiencing reliability issues, particularly on mobile and touch devices. This track focuses on replacing the existing slider logic and UI with a robust, accessible component from the **Radix UI** library while maintaining the project's visual identity.

## User Stories
- As a user, I want a timeline slider that responds instantly and reliably to my touch on mobile devices.
- As a user, I want to see real-time updates to my charts and data distribution as I adjust the date range.
- As a user, I want a UI that remains consistent with the dark-mode, Material Design aesthetic of the application.

## Functional Requirements
- **Radix UI Integration:**
  - Install and configure the Radix UI Slider primitive.
  - Implement a double-handle range slider for start and end date selection.
- **UI/UX Redesign:**
  - Decouple the slider handles from the histogram overlay.
  - Position the slider as a standalone control (e.g., directly below the histogram) to avoid touch target conflicts.
  - Apply custom styling using Tailwind CSS 4 to match the current "Clean Modernism" and "Dark Mode First" guidelines.
- **Interaction Logic:**
  - Map slider values (0-100) to actual Date objects from the energy data range.
  - Trigger real-time (debounced) updates to the `dateRange` state used by the dashboard and history views.

## Non-Functional Requirements
- **Touch Reliability:** Zero failures in registering drag gestures on mobile browsers.
- **Visual Consistency:** Handles, track, and range indicators must adhere to the Material Design philosophy (shadows, depth, 44px min touch target).
- **Accessibility:** Ensure the new component maintains or improves upon WCAG 2.1 parity (standard keyboard interactions provided by Radix).

## Acceptance Criteria
- [ ] Radix UI Slider is integrated and functional.
- [ ] Slider is positioned as a standalone control below the histogram.
- [ ] Real-time updates occur when dragging handles.
- [ ] Successful visual verification on mobile view using Chrome MCP.
