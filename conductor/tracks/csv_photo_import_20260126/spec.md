# Specification: CSV and Photo Reading Import

## Overview
This track introduces two high-efficiency methods for adding meter readings: a bulk CSV importer and an AI-assisted photo recognition tool. These features reduce manual entry friction and facilitate the onboarding of historical data.

## Functional Requirements

### 1. Dashboard CSV Importer
- **Entry Point:** A prominent "Import CSV" button/action on the Dashboard.
- **Workflow:**
    - **Upload:** User selects or drops a `.csv` file.
    - **Header Mapping:** Interactive step where the system identifies column headers (e.g., "Strom", "Gas"). The user maps each header to a specific existing Meter in the system or chooses to ignore it.
    - **Preview:** A data grid displays the parsed readings (Date, Value, Target Meter) for final review.
    - **Import:** On confirmation, readings are validated and saved to the database.

### 2. AI-Assisted Photo Import
- **Entry Point:** An "Auto-fill from Photo" option within the existing "Add Reading" screen.
- **Workflow:**
    - **Capture:** User takes a photo of their physical meter or uploads an image.
    - **Processing:** The image is sent to the Hugging Face Inference API using a free Vision/OCR model to extract the numerical value.
    - **Result:** The extracted value is automatically populated into the manual entry field for user confirmation/editing.

## Non-Functional Requirements
- **Performance:** CSV parsing and mapping should be handled client-side for immediate responsiveness.
- **Integration:** Use Hugging Face Inference API for cost-effective OCR capabilities.
- **Error Handling:** Clear messaging for unreadable photos or malformed CSV formats.

## Acceptance Criteria
- [ ] Users can map CSV headers to different meters.
- [ ] A preview table is shown before CSV data is saved.
- [ ] Photo OCR correctly populates the reading value field in the "Add Reading" flow.
- [ ] Duplicate readings (same meter/date) are handled or flagged during CSV import.

## Out of Scope
- Direct integration with energy provider APIs (web scraping).
- Advanced image cropping/preprocessing UI.
