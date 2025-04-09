import { useState, useCallback, useEffect } from "react";
import { EnergyDataType } from "../types";
import { parseCSVData, Separator } from "../utils/csvUtils";
import CSVImportModal from "./CSVImportModal";
import { UploadIcon, ClipboardIcon } from "./icons";

interface CSVDropZoneProps {
  onDataImported: (data: Omit<EnergyDataType, "_id">[]) => void;
}

export const CSVDropZone = ({ onDataImported }: CSVDropZoneProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Omit<EnergyDataType, "_id">[]>(
    []
  );
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const processCSVText = async (text: string, separator: Separator) =>
    parseCSVData(text, separator).then((csvData) => {
      setPreviewData(csvData.data);
      setIsModalOpen(true);
      setAlertMessage(null);
    });

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
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
    processCSVText(text, ",");
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setAlertMessage("Clipboard is empty or permission was denied.");
        return;
      }
      processCSVText(text, "\t");
    } catch (err) {
      console.error("Clipboard read error:", err);
      setAlertMessage(
        "Could not read from clipboard. Check browser permissions."
      );
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const hasFiles = e.dataTransfer.types.includes("Files");
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

  const onConfirmModal = (data: Omit<EnergyDataType, "_id">[]): void => {
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
};

export default CSVDropZone;
