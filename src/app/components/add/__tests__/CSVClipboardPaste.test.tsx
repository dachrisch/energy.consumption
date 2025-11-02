import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CSVClipboardPaste } from "../CSVClipboardPaste";
import { parseDateFlexible } from "@/app/utils/dateUtils";

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(),
  },
});

describe("CSVClipboardPaste", () => {
  const mockOnDataImported = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the clipboard paste area with correct text", () => {
    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    expect(screen.getByText("Paste from Clipboard")).toBeInTheDocument();
    expect(screen.getByText("Copy data from Excel or spreadsheet")).toBeInTheDocument();
    expect(screen.getByText("Paste CSV Data")).toBeInTheDocument();
    expect(screen.getByText("Required columns: date, type, amount")).toBeInTheDocument();
    expect(screen.getByText("Supports tab-separated values from spreadsheets")).toBeInTheDocument();
  });

  it("handles clipboard paste correctly", async () => {
    const clipboardData = "date\ttype\tamount\n2024-01-01\tpower\t100";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardData);

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });
  });

  it("shows error when clipboard access is denied", async () => {
    (navigator.clipboard.readText as jest.Mock).mockRejectedValue(
      new Error("Permission denied")
    );

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    expect(
      await screen.findByText(
        "Could not read from clipboard. Check browser permissions."
      )
    ).toBeInTheDocument();
  });

  it("shows error when clipboard is empty", async () => {
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue("");

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    expect(
      await screen.findByText("Clipboard is empty or permission was denied.")
    ).toBeInTheDocument();
  });

  it("calls onDataImported with correct data when import is confirmed", async () => {
    const clipboardData = "date\ttype\tamount\n2024-01-01\tpower\t100";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardData);

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });

    // Find and click the confirm button
    const confirmButton = screen.getByText("Import 1 Rows");
    fireEvent.click(confirmButton);

    // Verify that onDataImported was called with the correct data
    expect(mockOnDataImported).toHaveBeenCalledWith([
      {
        date: parseDateFlexible("2024-01-01"),
        type: "power",
        amount: 100,
      },
    ]);
  });

  it("closes modal when close button is clicked", async () => {
    const clipboardData = "date\ttype\tamount\n2024-01-01\tpower\t100";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardData);

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });

    // Find and click the cancel button
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId("csv-import-modal")).not.toBeInTheDocument();
    });

    // onDataImported should not have been called
    expect(mockOnDataImported).not.toHaveBeenCalled();
  });

  it("alert message auto-dismisses after timeout", async () => {
    jest.useFakeTimers();

    (navigator.clipboard.readText as jest.Mock).mockResolvedValue("");

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Alert should appear
    expect(
      await screen.findByText("Clipboard is empty or permission was denied.")
    ).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    // Alert should disappear
    await waitFor(() => {
      expect(
        screen.queryByText("Clipboard is empty or permission was denied.")
      ).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("handles multiple rows of data", async () => {
    const clipboardData = "date\ttype\tamount\n2024-01-01\tpower\t100\n2024-01-02\tgas\t50";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardData);

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });

    // Should show correct row count
    expect(screen.getByText("Import 2 Rows")).toBeInTheDocument();
  });

  it("processes TSV data with tabs as separators", async () => {
    const clipboardData = "date\ttype\tamount\n2024-01-01\tpower\t100";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardData);

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByText("Import 1 Rows");
    fireEvent.click(confirmButton);

    // Verify that data was parsed correctly with tab separator
    expect(mockOnDataImported).toHaveBeenCalledWith([
      {
        date: parseDateFlexible("2024-01-01"),
        type: "power",
        amount: 100,
      },
    ]);
  });

  it("does not call onDataImported when data is empty", async () => {
    const clipboardData = "date\ttype\tamount\n";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardData);

    render(<CSVClipboardPaste onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data");
    fireEvent.click(pasteButton);

    // Wait for modal and error message
    await waitFor(() => {
      expect(screen.getByText("No valid data rows found to import.")).toBeInTheDocument();
    });

    // onDataImported should not have been called
    expect(mockOnDataImported).not.toHaveBeenCalled();
  });
});
