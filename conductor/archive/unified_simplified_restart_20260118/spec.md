# Specification: Unified Simplified Energy Monitor (Restart)

## Overview
This track aims to restart the development of the Energy Consumption Monitor with a focus on simplicity, a modern component library (Shadcn/UI), and a streamlined user experience. It consolidates login, meter management, data entry, and insights into a more cohesive and less complex architecture.

## Functional Requirements

### 1. User Authentication & Isolation
- **Mechanism:** Implement NextAuth.js using the Credentials Provider (email/password).
- **Security:** Maintain strict user isolation at the database level using middleware/hooks to ensure users only ever interact with their own data.
- **Simplification:** Focus on a robust local auth flow before considering external providers.

### 2. Transparent Meter Management
- **Entity:** Meters (Power, Gas, etc.) are the primary containers for readings.
- **Creation Flow:** If a user hasn't registered a meter, the first reading input form will prompt for the Meter Number/Name and automatically create the entity.
- **Selection:** Simple dropdown or toggle to switch between existing meters for data entry and visualization.

### 3. Streamlined Data Entry
- **Inputs:** Meter reading value and date.
- **Logic:** Automatic validation to ensure readings are chronological and non-decreasing (for cumulative meters).

### 4. Simplified Insights & Display
- **Usage Lists:** Tabular views for Daily, Weekly, and Monthly consumption summaries.
- **Visualization:** Basic line charts using Chart.js to show usage trends.
- **Cost Projections:** Real-time calculation of expected costs for the current billing period based on historical averages and contract data.

### 5. On-Demand Contract Management
- **Triggers:** Users are prompted to enter contract details (base price, working price) only when they attempt to access cost-related insights.
- **Flexibility:** Contracts can be updated to reflect price changes over time.

## Non-Functional Requirements
- **Mobile-First Design:** Using Shadcn/UI and Tailwind CSS to ensure a polished, responsive interface.
- **Performance:** Fast page loads and reactive UI components.
- **Maintainability:** A cleaner, flatter project structure compared to the previous iteration.

## Acceptance Criteria
- [ ] Users can register/login and remain isolated from others' data.
- [ ] Entering the first reading for a new meter successfully creates both the meter and the reading.
- [ ] Usage lists and basic charts display data correctly.
- [ ] Cost projections are calculated and displayed once contract details are provided.

## Out of Scope
- Advanced energy forecasting models (focus on simple linear/historical projection).
- Third-party API integrations for smart meters.
- Multi-currency support.
