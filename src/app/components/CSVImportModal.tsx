import { useState, useCallback, useEffect } from "react";
import { EnergyData } from "../types";
import { UploadIcon, ClipboardIcon } from "./icons";
import { parseCSVData } from "../utils/csvUtils";
import { formatDateToBrowserLocale } from "../utils/dateUtils";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Omit<EnergyData, "_id">[]) => void;
  previewData: Omit<EnergyData, "_id">[];
  parseErrors: string[];
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onConfirm,
  previewData,
  parseErrors,
}: CSVImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-card/95 backdrop-blur-sm flex items-center justify-center z-50">
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
}

interface CSVDropZoneProps {
  onDataImported: (data: Omit<EnergyData, "_id">[]) => void;
}

export function CSVDropZone({ onDataImported }: CSVDropZoneProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Omit<EnergyData, "_id">[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const processCSVText = (text: string) => {
    try {
      const result = parseCSVData(text);
      setPreviewData(result.data);
      setParseErrors(result.errors);
      setIsModalOpen(true);
      setAlertMessage(null);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setAlertMessage("An unexpected error occurred while parsing the data.");
      setIsModalOpen(false); 
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find(
        (file) => file.type === "text/csv" || file.name.endsWith(".csv")
      );

      if (!csvFile) {
        setAlertMessage("Please drop a CSV file.");
        return;
      }

      const text = await csvFile.text();
      processCSVText(text);
    },
    []
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
       if (!text) {
         setAlertMessage("Clipboard is empty or permission was denied.");
         return;
       }
      processCSVText(text);
    } catch (err) {
      console.error("Clipboard read error:", err);
      setAlertMessage("Could not read from clipboard. Check browser permissions.");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (hasFiles) {
       setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
        setIsDragging(false);
    }
  }, []);

  const onCloseModal = (): void => {
    setPreviewData([]);
    setParseErrors([]);
    setIsModalOpen(false);
  };

  const onConfirmModal = (data: Omit<EnergyData, "_id">[]): void => {
    if (data.length > 0) {
        onDataImported(data);
    }
    onCloseModal();
  };

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  return (
    <div className="space-y-4">
        {alertMessage && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded text-center text-sm">
                {alertMessage}
            </div>
        )}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/70"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center gap-2">
            <UploadIcon className="w-10 h-10 text-muted-foreground" />
            <p className="text-lg font-medium">Drop your CSV file here</p>
            <p className="text-sm text-muted-foreground">
              Or paste data from clipboard below.
            </p>
            <p className="text-xs text-muted-foreground">
              Required columns: date, type, amount
            </p>
          </div>
          <div className="absolute inset-0"></div>
        </div>
        
        <button
             onClick={handlePaste}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md"
           >
             <ClipboardIcon className="h-5 w-5" />
             Paste CSV Data from Clipboard
           </button>

      <CSVImportModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onConfirm={onConfirmModal}
        previewData={previewData}
        parseErrors={parseErrors}
      />
    </div>
  );
}
