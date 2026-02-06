import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import UnifiedImportModal from './UnifiedImportModal';

describe('UnifiedImportModal', () => {
  const mockOnClose = () => {};
  const mockOnSave = async () => {};
  const mockMeters = [{ _id: 'meter-1', name: 'Test Meter' }];

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      render(() => (
        <UnifiedImportModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          meters={mockMeters}
        />
      ));

      expect(screen.queryByText(/Import Readings/i)).toBeTruthy();
    });
  });

  describe('file upload', () => {
    it('should have file input element', () => {
      render(() => (
        <UnifiedImportModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          meters={mockMeters}
        />
      ));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();
    });

    it('should accept both JSON and CSV files', () => {
      render(() => (
        <UnifiedImportModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          meters={mockMeters}
        />
      ));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput?.accept).toContain('json');
      expect(fileInput?.accept).toContain('csv');
    });
  });

  describe('modal actions', () => {
    it('should have cancel button in upload step', () => {
      render(() => (
        <UnifiedImportModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          meters={mockMeters}
        />
      ));

      const cancelButtons = document.querySelectorAll('button');
      const cancelButton = Array.from(cancelButtons).find((b) =>
        b.textContent?.includes('Cancel')
      );
      expect(cancelButton).toBeTruthy();
    });
  });

  describe('empty meters state', () => {
    it('should show empty state when no meters exist on upload step', () => {
      render(() => (
        <UnifiedImportModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          meters={[]}
        />
      ));

      // Should show a message about no meters
      const noMetersMessage = screen.queryByText(/No meters found/i);
      expect(noMetersMessage).toBeTruthy();
    });
  });
});
