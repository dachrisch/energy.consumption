import { EnergyBase } from "@/app/types";
import { parseCSVData } from "@/app/utils/csvUtils";
import { useState, useCallback, useEffect } from "react";
import { ClipboardIcon } from "../icons";
import CSVImportModal from "../modals/CSVImportModal";
import { ALERT_TIMEOUT_MS } from "@/app/constants/ui";

interface CSVClipboardPasteProps {
  onDataImported: (data: EnergyBase[]) => void;
}

export const CSVClipboardPaste = ({ onDataImported }: CSVClipboardPasteProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<EnergyBase[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const processCSVText = async (text: string) =>
    parseCSVData(text, "\t").then((csvData) => {
      setPreviewData(csvData.data);
      setIsModalOpen(true);
      setAlertMessage(null);
    });

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
      setAlertMessage(
        "Could not read from clipboard. Check browser permissions."
      );
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

      <div className="flex flex-col items-center justify-center p-8 md:p-12 space-y-6">
        <div className="text-center space-y-3">
          <ClipboardIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto" />
          <div>
            <p className="text-base md:text-lg font-medium">Paste from Clipboard</p>
            <p className="text-sm text-muted-foreground mt-1">
              Copy data from Excel or spreadsheet
            </p>
          </div>
        </div>

        <button
          onClick={handlePaste}
          className="w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 text-base font-medium"
        >
          <ClipboardIcon className="h-5 w-5" />
          Paste CSV Data
        </button>

        <div className="text-xs text-muted-foreground text-center space-y-1 max-w-md">
          <p>Required columns: date, type, amount</p>
          <p className="opacity-75">Supports tab-separated values from spreadsheets</p>
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

export default CSVClipboardPaste;
