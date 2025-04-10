'use client';

import { EnergyDataType } from "../types";
import { formatDateToBrowserLocale } from "../utils/dateUtils";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Omit<EnergyDataType, "_id">[]) => void;
  previewData: Omit<EnergyDataType, "_id">[];
  parseErrors: string[];
}

const CSVImportModal = ({
  isOpen,
  onClose,
  onConfirm,
  previewData,
  parseErrors,
}: CSVImportModalProps) => {
  if (!isOpen) return null;

  return (
    <div data-testid="csv-import-modal" className="fixed inset-0 bg-card/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg max-w-4xl w-full border border-border">
        <h3 className="text-lg font-semibold mb-4">Confirm CSV Import</h3>
        
        {parseErrors.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
            <p className="font-medium mb-1">Parsing Errors Found:</p>
            <ul className="list-disc list-inside text-sm">
              {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
            <p className="text-sm mt-2">Only valid rows are shown below and will be imported.</p>
          </div>
        )}

        {previewData.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2">Preview of data to be imported ({previewData.length} rows):</p>
            <div className="overflow-x-auto max-h-60 border border-border rounded">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="p-2 border-b border-border text-left">Date</th>
                    <th className="p-2 border-b border-border text-left">Type</th>
                    <th className="p-2 border-b border-border text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                      <td className="p-2 border-r border-border">{formatDateToBrowserLocale(row.date)}</td>
                      <td className="p-2 border-r border-border capitalize">{row.type}</td>
                      <td className="p-2">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
           <p className="text-center text-muted-foreground mb-4">No valid data rows found to import.</p>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
          >
            Cancel
          </button>
          {previewData.length > 0 && (
            <button
              onClick={() => onConfirm(previewData)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              Import {previewData.length} Rows
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
