# Implementation Plan: CSV and Photo Reading Import

## Phase 1: Foundation & CSV Parsing Logic
- [x] Task: TDD - Create unit tests for CSV parsing utility.
    - [x] Handle various delimiters (comma, semicolon, space as seen in user example).
    - [x] Support European number formatting (e.g., `3877,3` with comma as decimal).
    - [x] Handle multiple date formats.
- [x] Task: Implement CSV parsing utility in `src/lib/csvParser.ts`.
- [x] Task: TDD - Create unit tests for Reading bulk insertion logic.
    - [x] Verify validation against existing Meters.
    - [x] Verify duplicate detection logic.
- [x] Task: Implement bulk insertion API handler or service logic.

## Phase 2: CSV Import UI (Dashboard)
- [x] Task: TDD - Create component tests for `CsvImportModal`.
    - [x] Test file upload/drop interaction.
    - [x] Test header mapping interface.
    - [x] Test preview table rendering.
- [x] Task: Implement `CsvImportModal` component using DaisyUI.
- [x] Task: Integrate "Import CSV" button into the `Dashboard.tsx` page.
- [x] Task: Visual Verification - Use Chrome DevTools to verify responsive layout of the import flow.

## Phase 3: Photo OCR Integration (Add Reading)
- [x] Task: TDD - Create backend route tests for OCR proxy (security verification).
- [x] Task: Implement backend API route `/api/ocr/scan` to proxy requests to Hugging Face (using `HUGGING_FACE_TOKEN`).
- [x] Task: Implement frontend `ocrService` to call the local backend proxy.
- [x] Task: TDD - Update `AddReading.tsx` tests to include photo upload triggers.
- [x] Task: Enhance `AddReading.tsx` UI with a "Scan Photo" button and image preview.
- [x] Task: Implement photo-to-value population logic with user confirmation.

## Phase 4: Finalization & Quality Assurance
- [ ] Task: Run full integration test suite to ensure no regressions in reading history or aggregates.
- [ ] Task: Verify test coverage for new utilities and components (target >80%).
- [ ] Task: Final visual polish and error state handling (e.g., API failures, invalid CSV formats).
