# Specification: Meter Insights & Contract Validation

## Overview
This track enhances the meter management experience by adding financial context to daily consumption, improving the dashboard layout, and introducing a validation layer to ensure contract coverage matches historical data. It also adds predictive visualization to help users anticipate yearly usage.

## Functional Requirements

### 1. Enhanced Meter Grid & Metrics
- **Layout:** Update the Meters page grid to display 2 cards per row (matching the Contracts layout) for better information density on larger screens.
- **Daily Cost Metric:** Below the "kWh/day" (or unit/day) display, add a smaller "Cost per Day" metric.
- **Calculation:** The cost per day for the current interval must be calculated using the contract(s) active during that specific period.

### 2. Contract Coverage Validation
- **Gap Detection:** Implement logic to compare the start date of the first reading and the end date of the last reading against the coverage periods of all associated contracts.
- **Meter Warning:** Display a simple warning icon/badge on the Meter card if any period of its reading history is not covered by a contract.
- **Contract Templates:** In the Contracts section, if gaps are detected, display "Template Cards" (placeholders) that allow users to one-click create a contract for the specific missing date range.

### 3. Predictive Projection Chart
- **Visualization:** Add a projection chart to the Meter detail view.
- **Logic:** Extrapolate the "Current Velocity" (daily average of the most recent reading interval) across the next 365 days.
- **UI:** The future projection must be visually distinct, using a dotted line starting from the most recent actual reading.

## Non-Functional Requirements
- **Precision:** Financial calculations should handle rounding to 2 decimal places for display.
- **Responsiveness:** The 2-column grid should collapse gracefully to 1 column on small mobile devices.

## Acceptance Criteria
- [ ] Meters page uses a 2-per-row grid layout on md+ screens.
- [ ] Meter cards show "€/day" below usage metrics.
- [ ] Contract coverage gaps are identified and visible on both Meter and Contract pages.
- [ ] Meter detail page shows a chart with a dotted projection line based on recent velocity.
