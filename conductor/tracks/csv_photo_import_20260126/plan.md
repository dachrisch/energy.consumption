# Implementation Plan: CSV and Photo Reading Import

## Phase 1: Foundation & CSV Parsing Logic
- [ ] Task: TDD - Create unit tests for CSV parsing utility.
    - [ ] Handle various delimiters (comma, semicolon, space as seen in user example).
    - [ ] Support European number formatting (e.g., `3877,3` with comma as decimal).
    - [ ] Handle multiple date formats.
- [ ] Task: Implement CSV parsing utility in `src/lib/csvParser.ts`.
- [ ] Task: TDD - Create unit tests for Reading bulk insertion logic.
    - [ ] Verify validation against existing Meters.
    - [ ] Verify duplicate detection logic.
- [ ] Task: Implement bulk insertion API handler or service logic.

## Phase 2: CSV Import UI (Dashboard)
- [ ] Task: TDD - Create component tests for `CsvImportModal`.
    - [ ] Test file upload/drop interaction.
    - [ ] Test header mapping interface.
    - [ ] Test preview table rendering.
- [ ] Task: Implement `CsvImportModal` component using DaisyUI.
- [ ] Task: Integrate "Import CSV" button into the `Dashboard.tsx` page.
- [ ] Task: Visual Verification - Use Chrome DevTools to verify responsive layout of the import flow.

## Phase 3: Photo OCR Integration (Add Reading)
- [ ] Task: TDD - Create backend route tests for OCR proxy (security verification).
- [ ] Task: Implement backend API route `/api/ocr/scan` to proxy requests to Hugging Face (using `HUGGING_FACE_TOKEN`).
- [ ] Task: Implement frontend `ocrService` to call the local backend proxy.
- [ ] Task: TDD - Update `AddReading.tsx` tests to include photo upload triggers.
- [ ] Task: Enhance `AddReading.tsx` UI with a "Scan Photo" button and image preview.
- [ ] Task: Implement photo-to-value population logic with user confirmation.

## Phase 4: Finalization & Quality Assurance
- [ ] Task: Run full integration test suite to ensure no regressions in reading history or aggregates.
- [ ] Task: Verify test coverage for new utilities and components (target >80%).
- [ ] Task: Final visual polish and error state handling (e.g., API failures, invalid CSV formats).
