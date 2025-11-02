import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CSVFileUpload } from "../CSVFileUpload";
import { parseDateFlexible } from "@/app/utils/dateUtils";

describe("CSVFileUpload", () => {
  const mockOnDataImported = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the upload area with correct text", () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    expect(screen.getByText("Drop CSV file here")).toBeInTheDocument();
    expect(screen.getByText("or click to browse")).toBeInTheDocument();
    expect(screen.getByText("Required columns: date, type, amount")).toBeInTheDocument();
    expect(screen.getByText("Supports comma-separated values")).toBeInTheDocument();
  });

  it("handles file selection through input", async () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const input = document.getElementById("csv-file-input") as HTMLInputElement;
    const csvContent = "date,type,amount\n2024-01-01,power,100";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    // Mock the text() method
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue(csvContent),
    });

    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });
  });

  it("shows alert when non-CSV file is selected via input", async () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const input = document.getElementById("csv-file-input") as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    Object.defineProperty(input, "files", {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    expect(await screen.findByText("Please select a CSV file.")).toBeInTheDocument();
  });

  it("handles file drop correctly", async () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const csvContent = "date,type,amount\n2024-01-01,power,100";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    // Mock the text() method
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue(csvContent),
    });

    const dataTransfer = {
      files: [file],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("csv-import-modal")).toBeInTheDocument();
    });
  });

  it("shows alert when non-CSV file is dropped", async () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const dataTransfer = {
      files: [file],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    expect(await screen.findByText("Please drop a CSV file.")).toBeInTheDocument();
  });

  it("handles drag over event correctly", () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const dataTransfer = {
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });

    // Verify dragging class is applied
    expect(dropZone).toHaveClass("border-primary", "bg-primary/10");
  });

  it("handles drag leave event correctly", () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const dataTransfer = {
      types: ["Files"],
    };

    // Start dragging
    fireEvent.dragOver(dropZone!, { dataTransfer });

    // Verify dragging class is applied
    expect(dropZone).toHaveClass("bg-primary/10");

    // Leave the drag zone
    fireEvent.dragLeave(dropZone!, {
      relatedTarget: null,
      currentTarget: dropZone,
    });

    // The drag styling should be removed
    expect(dropZone).not.toHaveClass("bg-primary/10");
  });

  it("calls onDataImported with correct data when import is confirmed", async () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const csvContent = "date,type,amount\n2024-01-01,power,100";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    // Mock the text() method
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue(csvContent),
    });

    const dataTransfer = {
      files: [file],
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
        type: "power",
        amount: 100,
      },
    ]);
  });

  it("closes modal when close button is clicked", async () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const csvContent = "date,type,amount\n2024-01-01,power,100";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    // Mock the text() method
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue(csvContent),
    });

    const dataTransfer = {
      files: [file],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

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

    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const dataTransfer = {
      files: [file],
      types: ["Files"],
    };

    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });

    // Alert should appear
    expect(await screen.findByText("Please drop a CSV file.")).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    // Alert should disappear
    await waitFor(() => {
      expect(screen.queryByText("Please drop a CSV file.")).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("opens file dialog when clicking the drop zone", () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const dropZone = screen.getByText("Drop CSV file here").parentElement?.parentElement?.parentElement;
    const input = document.getElementById("csv-file-input") as HTMLInputElement;

    const clickSpy = jest.spyOn(input, "click");

    fireEvent.click(dropZone!);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("handles empty file selection gracefully", () => {
    render(<CSVFileUpload onDataImported={mockOnDataImported} />);

    const input = document.getElementById("csv-file-input") as HTMLInputElement;

    Object.defineProperty(input, "files", {
      value: null,
      writable: false,
    });

    fireEvent.change(input);

    // Should not crash or show any error
    expect(screen.queryByText("Please select a CSV file.")).not.toBeInTheDocument();
  });
});
