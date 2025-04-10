import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CSVDropZone } from "../CSVDropZone";
import { parseDateFlexible } from "@/app/utils/dateUtils";

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(),
  },
});

describe("CSVDropZone", () => {
  const mockOnDataImported = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the drop zone with correct text", () => {
    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    expect(screen.getByText("Drop your CSV file here")).toBeInTheDocument();
    expect(
      screen.getByText("Or paste data from clipboard below.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Required columns: date, type, amount")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Paste CSV Data from Clipboard")
    ).toBeInTheDocument();
  });

  it("shows alert when non-CSV file is dropped", async () => {
    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop your CSV file here").parentElement
      ?.parentElement;

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const dataTransfer = {
      files: [file],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    expect(
      await screen.findByText("Please drop a CSV file.")
    ).toBeInTheDocument();
  });

  it("handles CSV file drop correctly", async () => {
    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop your CSV file here").parentElement
      ?.parentElement;

    const csvContent = "date,type,amount\n2024-01-01,electricity,100";
    const dataTransfer = {
      files: [{ type: "text/csv", name: "test.csv", text: () => csvContent }],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    // The modal should open with the preview data
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });
  });

  it("handles clipboard paste correctly", async () => {
    const clipboardData = "date\ttype\tamount\n2024-01-01\telectricity\t100";
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue(
      clipboardData
    );

    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data from Clipboard");
    fireEvent.click(pasteButton);

    // The modal should open with the preview data
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });
  });

  it("shows error when clipboard access is denied", async () => {
    (navigator.clipboard.readText as jest.Mock).mockRejectedValue(
      new Error("Permission denied")
    );

    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data from Clipboard");
    fireEvent.click(pasteButton);

    expect(
      await screen.findByText(
        "Could not read from clipboard. Check browser permissions."
      )
    ).toBeInTheDocument();
  });

  it("shows error when clipboard is empty", async () => {
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue("");

    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    const pasteButton = screen.getByText("Paste CSV Data from Clipboard");
    fireEvent.click(pasteButton);

    expect(
      await screen.findByText("Clipboard is empty or permission was denied.")
    ).toBeInTheDocument();
  });

  it("calls onDataImported with correct data when import is confirmed", async () => {
    render(<CSVDropZone onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop your CSV file here").parentElement
      ?.parentElement;

    const csvContent = "date,type,amount\n2024-01-01,electricity,100";
    const dataTransfer = {
      files: [{ type: "text/csv", name: "test.csv", text: () => csvContent }],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

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
        type: "electricity",
        amount: 100
      }
    ]);
  });
});
