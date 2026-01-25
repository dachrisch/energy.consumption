# Specification: Unified Financial Dashboard & Quick Operations

## Overview
This track involves a significant reorganization of the application's home base. We will transition the current meter grid to a dedicated `/meters` view and transform `/dashboard` into a high-level financial cockpit. Key enhancements include aggregated cost analysis across all energy sources and a "Quick Add" operation for meter readings to minimize user friction.

## Track Type
- Feature (UI/UX Reorganization & Aggregated Analytics)

## Functional Requirements
- **Route Reorganization:**
    - Transition the existing meter grid view to a new `/meters` route.
    - Repurpose `/dashboard` as the primary home page for aggregated insights.
- **Financial Cockpit (Dashboard):**
    - Implement a "Total Energy Cost" summary card.
    - Provide a breakdown within this card showing the contributions of "Power" vs. "Gas" to the total projected cost.
    - Aggregate data from all active contracts and consumption stats.
- **Quick Operations:**
    - Add a "Quick Add Reading" button to the Dashboard header action area.
    - Enhance the "Add Reading" dialog/form to include a meter selection dropdown.
    - Default the dropdown selection to the user's most recently used meter.
- **Navigation Update:**
    - Update AppBar and BottomNav to include the new "Meters" destination.

## Non-Functional Requirements
- **Data Consistency:** Ensure aggregated costs correctly reflect the sum of all individual meter projections.
- **Responsive Layout:** The new "Total Energy Cost" card must be highly readable on both mobile and desktop.
- **Minimal Latency:** Aggregation logic should be optimized to prevent slow Dashboard loads.

## Acceptance Criteria
- [ ] `/dashboard` displays the new aggregated cost card with Power/Gas breakdown.
- [ ] `/meters` correctly displays the existing utility meter grid.
- [ ] Users can trigger a "Quick Add" from the Dashboard and select their meter from a dropdown.
- [ ] The "Add Reading" form defaults to the last used meter.
- [ ] All navigation bars reflect the new structure.

## Out of Scope
- Detailed cost breakdowns per room or specific appliance.
- Advanced budget tracking (e.g., target vs. actual) beyond projections.
