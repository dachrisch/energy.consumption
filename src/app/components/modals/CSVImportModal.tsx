'use client';
import { NewEnergyDataType } from "../../types";
import { formatDateToBrowserLocale } from "../../utils/dateUtils";

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
    <div data-testid="csv-import-modal" className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">Confirm CSV Import</h3>
        
        {parseErrors.length > 0 && (
          <div className="alert-error">
            <p className="alert-text">Parsing Errors Found:</p>
            <ul className="alert-list">
              {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
            <p className="modal-text">Only valid rows are shown below and will be imported.</p>
          </div>
        )}

        {previewData.length > 0 ? (
          <div className="mb-4">
            <p className="modal-text">Preview of data to be imported ({previewData.length} rows):</p>
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">Date</th>
                    <th className="table-cell">Type</th>
                    <th className="table-cell">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell">{formatDateToBrowserLocale(row.date)}</td>
                      <td className="table-cell capitalize">{row.type}</td>
                      <td className="table-cell">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
           <p className="modal-text ">No valid data rows found to import.</p>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="modal-button-cancel">Cancel</button>
          {previewData.length > 0 && (
            <button onClick={() => onConfirm(previewData)} className="modal-button-confirm">
              Import {previewData.length} Rows
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
