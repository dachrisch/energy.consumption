# Specification: Profile & Contract Management

## Overview
This track focuses on enhancing the user's control over their energy data by implementing a comprehensive contract management system and refining the profile display. By capturing detailed pricing data (base and working prices) over specific time periods, the application will be able to calculate and project energy costs accurately.

## Track Type
- Feature (Data Management & Calculations)

## Functional Requirements
- **Contract Management:**
    - Dedicated "Contracts" page for viewing and managing all utility contracts.
    - Ability to add/edit contracts with the following attributes:
        - Provider Name
        - Start and End Dates (Time Period)
        - Base Price (Monthly fixed fee)
        - Working Price (Price per unit)
        - Contract Type (Power or Gas)
        - Direct link to a specific Meter.
- **Profile Display:**
    - Persistent display of user name and email within the AppBar's Avatar Dropdown.
- **Cost Calculation Logic:**
    - Integrate contract pricing into the consumption analytics to provide historical and projected cost insights.

## Non-Functional Requirements
- **Data Integrity:** Ensure contract periods for the same meter do not overlap (validation).
- **Calculation Accuracy:** Precision in cost aggregation based on prorated base prices and total units consumed.
- **Responsive UI:** Ensure the contract management forms are highly optimized for mobile entry.

## Acceptance Criteria
- [ ] Users can navigate to a "Contracts" page and see a list of their current contracts.
- [ ] Users can successfully create a new contract linked to an existing meter.
- [ ] Profile dropdown in the AppBar correctly displays the authenticated user's name and email.
- [ ] Consumption charts and stats now include cost data based on the active contract for that period.
- [ ] System prevents or warns about overlapping contract dates for the same meter.

## Out of Scope
- Direct bill uploading or PDF parsing.
- Advanced user settings beyond basic profile display.
