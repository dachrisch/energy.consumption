import { EnergyBase } from "@/app/types";
import { parseCSVData } from "@/app/utils/csvUtils";
import { useState, useCallback, useEffect } from "react";
import { UploadIcon } from "../icons";
import CSVImportModal from "../modals/CSVImportModal";
import { ALERT_TIMEOUT_MS } from "@/app/constants/ui";

interface CSVFileUploadProps {
  onDataImported: (data: EnergyBase[]) => void;
}

export const CSVFileUpload = ({ onDataImported }: CSVFileUploadProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<EnergyBase[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const processCSVText = async (text: string) =>
    parseCSVData(text, ",").then((csvData) => {
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
    processCSVText(text);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("csv") && !file.name.endsWith(".csv")) {
      setAlertMessage("Please select a CSV file.");
      return;
    }

    const text = await file.text();
    processCSVText(text);
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

  const onConfirmModal = (data: EnergyBase[]): void => {
    if (data.length > 0) {
      onDataImported(data);
    }
    onCloseModal();
  };

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), ALERT_TIMEOUT_MS);
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
        className={`relative border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/70"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("csv-file-input")?.click()}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <UploadIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
          <div>
            <p className="text-base md:text-lg font-medium">Drop CSV file here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>Required columns: date, type, amount</p>
            <p className="text-xs opacity-75">Supports comma-separated values</p>
          </div>
        </div>
      </div>

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

export default CSVFileUpload;
