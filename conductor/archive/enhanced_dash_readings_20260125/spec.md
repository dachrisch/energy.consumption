# Specification: Enhanced Dashboard & Reading Management

## Overview
This track aims to refine the application's information architecture by clearly separating high-level summaries from detailed data views. We will enhance the main Dashboard to include cost and projection insights, implement a dedicated reading history view with CRUD capabilities, and optimize the navigation flow after data entry.

## Track Type
- Feature (UX Refinement & Data Visualization)

## Functional Requirements
- **Dashboard Enhancement:**
    - Update the Dashboard to display daily average, yearly projection, and estimated costs for each utility meter.
    - Use a high-level summary card format for an aggregated overview.
- **Reading History View:**
    - Create a new "Readings" list view for individual meters.
    - Display reading data in a tabular format including:
        - Date of reading.
        - Absolute value.
        - Delta (consumption since the previous reading).
    - Provide inline actions to edit or delete historical readings.
    - Implement pagination or infinite scroll for large datasets.
- **Improved Redirection:**
    - After successfully adding a reading, the user must be redirected to the "Readings" list for that specific meter instead of the main dashboard.

## Non-Functional Requirements
- **Data Clarity:** Ensure delta calculations are accurate and clearly visualized in the table.
- **Performance:** Optimize the reading history table for fast rendering and smooth scrolling.
- **User Feedback:** Use clear success/error notifications during reading CRUD operations.

## Acceptance Criteria
- [ ] Dashboard cards for each meter show daily avg, yearly proj, and estimated cost.
- [ ] A dedicated "Readings" list page exists for each meter.
- [ ] The readings table correctly calculates and displays consumption deltas between entries.
- [ ] Users can edit or delete a reading, and the list updates immediately.
- [ ] Successfully saving a new reading redirects the user to the meter's reading list.

## Out of Scope
- Global search across all readings from all meters in a single table.
- Exporting reading history to CSV/PDF (future track).
