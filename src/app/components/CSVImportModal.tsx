import { useState, useCallback } from "react";
import { EnergyData, EnergyType } from "../types";
import { UploadIcon } from "./icons";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Omit<EnergyData, "_id">[]) => void;
  previewData: Omit<EnergyData, "_id">[];
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onConfirm,
  previewData,
}: CSVImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-card/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg max-w-4xl w-full border border-border">
        <h3 className="text-lg font-semibold mb-4">Import CSV Data</h3>
        <div className="mb-4">
          <p className="mb-2">Preview of data to be imported:</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="p-2 border border-border">Date</th>
                  <th className="p-2 border border-border">Type</th>
                  <th className="p-2 border border-border">Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="p-2 border border-border">{row.date}</td>
                    <td className="p-2 border border-border capitalize">
                      {row.type}
                    </td>
                    <td className="p-2 border border-border">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(previewData)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}

interface CSVDropZoneProps {
  onDrop: (data: Omit<EnergyData, "_id">[]) => void;
}

export function CSVDropZone({ onDrop }: CSVDropZoneProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Omit<EnergyData, "_id">[]>([]);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find(
        (file) => file.type === "text/csv" || file.name.endsWith(".csv")
      );

      if (!csvFile) {
        alert("Please drop a CSV file");
        return;
      }

      try {
        const text = await csvFile.text();
        const lines = text.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        const data = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((header, i) => {
              row[header] = values[i];
            });
            return row;
          })
          .map((row) => ({
            date: row.date,
            type: row.type as "power" | "gas",
            amount: parseFloat(row.amount),
          }))
          .filter(
            (item) =>
              item.date &&
              (item.type === "power" || item.type === "gas") &&
              !isNaN(item.amount)
          );

        setIsDropModalOpen(true);

        setPreviewData(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV file");
      }
    },
    [setPreviewData, setIsDropModalOpen]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const hasFiles = Array.from(e.dataTransfer.items).some(
      (item) =>
        item.kind === "file" && (item.type === "text/csv" || item.type === "")
    );
    if (hasFiles) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onCloseModal=(): void =>{
    setPreviewData([]);
    setIsDropModalOpen(false);
  }

  const onConfirmModal=(data: Omit<EnergyData, "_id">[]): void =>{
    onDrop(data);
    setIsDropModalOpen(false);
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center gap-2">
        <UploadIcon />
        <p className="text-lg font-medium">Drop your CSV file here</p>
        <p className="text-sm text-muted-foreground">
          The file should have columns: date, type, amount
        </p>
      </div>
      <CSVImportModal
        isOpen={isDropModalOpen}
        onClose={onCloseModal}
        onConfirm={onConfirmModal}
        previewData={previewData}
      />
    </div>
  );
}
