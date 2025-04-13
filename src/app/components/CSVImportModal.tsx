'use client';
import {  NewEnergyDataType } from "../types";
import { formatDateToBrowserLocale } from "../utils/dateUtils";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: NewEnergyDataType[]) => void;
  previewData: NewEnergyDataType[];
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
    <div data-testid="csv-import-modal" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Confirm CSV Import</h3>
        
        {parseErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
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
            <div className="overflow-x-auto max-h-60 border border-gray-200 rounded">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="p-2 border-b border-gray-200 text-left">Date</th>
                    <th className="p-2 border-b border-gray-200 text-left">Type</th>
                    <th className="p-2 border-b border-gray-200 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <td className="p-2 border-r border-gray-200">{formatDateToBrowserLocale(row.date)}</td>
                      <td className="p-2 border-r border-gray-200 capitalize">{row.type}</td>
                      <td className="p-2">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
           <p className="text-center text-gray-500 mb-4">No valid data rows found to import.</p>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            Cancel
          </button>
          {previewData.length > 0 && (
            <button
              onClick={() => onConfirm(previewData)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md"
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
