# Specification: Constrain Chart to Viewport Width

## Overview
The energy consumption chart currently overflows its container on mobile devices, causing horizontal scrolling of the entire page or broken layouts. This track implements a CSS-based constraint to ensure the chart always remains within the bounds of the viewport width on small screens.

## Functional Requirements
- **Viewport Constraint:**
    - The `ConsumptionChart` component must never exceed the width of its parent container.
    - Apply `max-width: 100%` and `overflow: hidden` (or equivalent Tailwind classes) to the chart's wrapper.
- **Responsive Sizing:**
    - Ensure Chart.js correctly detects the container size change and resizes the internal canvas accordingly to avoid blurry rendering.

## Non-Functional Requirements
- **Layout Integrity:** The mobile "Global Card" must remain centered and correctly padded without being forced wide by the chart content.
- **Visual Consistency:** The chart should look natural and readable even when compressed on smaller devices (like iPhone SE).

## Acceptance Criteria
- [ ] On mobile devices (< 768px), the page has no horizontal scrollbar caused by the chart.
- [ ] The chart canvas width matches the internal width of the card container.
- [ ] Resizing the browser window dynamically updates the chart width without overflow.

## Out of Scope
- Redesigning the chart data or axis (handled in previous tracks).
- Changing the chart's aspect ratio on desktop.
