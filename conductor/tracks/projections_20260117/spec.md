# Track Specification: Monthly Consumption Projections and Cost Estimation

## Overview
Implement a projection engine that estimates future energy consumption and costs based on historical data and active contract pricing. This feature will help users budget effectively and detect anomalies in their usage patterns.

## User Stories
- As a user, I want to see an estimate of my energy bill for the current month.
- As a user, I want to see projected costs for the remainder of the year based on my average consumption.
- As a user, I want to understand how my current usage compares to my projected usage.

## Functional Requirements
- **Projection Engine:**
  - Calculate average daily consumption per energy type (power/gas).
  - Account for seasonal variations if historical data permits (e.g., higher gas usage in winter).
  - Apply active contract rates (base price + working price) to projected consumption.
- **Backend:**
  - Create a service or utility to perform projection calculations.
  - Expose projections via a new or existing API endpoint.
- **Frontend:**
  - Add a "Projections" card to the dashboard.
  - Visualize projected vs. actual consumption using charts.
  - Display "Estimated Bill" for the current billing period.

## Non-Functional Requirements
- **Performance:** Projection calculations should be fast (< 200ms).
- **Accuracy:** Clearly label projections as "estimates" to manage user expectations.
- **Mobile-First:** Projections card must be highly readable on small screens.

## Technical Constraints
- Must integrate with existing `Energy` and `Contract` Mongoose models.
- Calculations should happen on the server side (Server Actions or Services).
