import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContractForm from "../ContractForm";
import { EnergyOptions } from "@/app/types";
import { ContractValidationService } from "@/app/services/validationService";

describe("ContractForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const initialData = {
    _id: "test-id",
    userId: "user-123",
    type: "power" as EnergyOptions,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    basePrice: 100,
    workingPrice: 0.25
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with all fields", () => {
    render(<ContractForm onSubmit={mockOnSubmit} existingContracts={[]} />);

    expect(screen.getByLabelText("Start")).toBeInTheDocument();
    expect(screen.getByLabelText("End (optional)")).toBeInTheDocument();
    expect(screen.getByTestId('contract-base-price')).toBeInTheDocument();
    expect(screen.getByTestId('contract-working-price')).toBeInTheDocument();
    expect(screen.getByText("power")).toBeInTheDocument();
    expect(screen.getByText("gas")).toBeInTheDocument();
    expect(screen.getByText("Save Contract")).toBeInTheDocument();
  });

  it("handles type selection", () => {
    render(<ContractForm onSubmit={mockOnSubmit} existingContracts={[]} />);

    const gasRadio = screen.getByText("gas");
    fireEvent.click(gasRadio);

    expect(screen.getByText("gas").closest("label")).toHaveClass("bg-primary");
    expect(screen.getByText("power").closest("label")).not.toHaveClass("bg-primary");
  });

  it("validates prices must be positive", () => {
    render(<ContractForm onSubmit={mockOnSubmit} existingContracts={[]} />);
    const workingPriceInput = screen.getByTestId('contract-working-price');
    fireEvent.change(workingPriceInput, { target: { value: "1" } });

    const basePriceInput = screen.getByTestId('contract-base-price');
    fireEvent.change(basePriceInput, { target: { value: "-10" } });

    const submitButton = screen.getByText("Save Contract");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Prices cannot be negative")).toBeInTheDocument();
  });

  it("validates end date must be after start date", () => {
    render(<ContractForm onSubmit={mockOnSubmit} existingContracts={[]} />);

    const basePriceInput = screen.getByTestId('contract-base-price');
    const workingPriceInput = screen.getByTestId('contract-working-price');

    fireEvent.change(basePriceInput, { target: { value: "150" } });
    fireEvent.change(workingPriceInput, { target: { value: "0.30" } });

    const startDateInput = screen.getByLabelText("Start");
    const endDateInput = screen.getByLabelText("End (optional)");

    fireEvent.change(startDateInput, { target: { value: "2025-12-31" } });
    fireEvent.change(endDateInput, { target: { value: "2025-01-01" } });

    const submitButton = screen.getByText("Save Contract");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("End date must be after start date")).toBeInTheDocument();
  });

  it("prevents overlapping contracts for same type", async () => {
    const existingContracts = [{
      _id: "1",
      userId: "user-123",
      type: "power" as EnergyOptions,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      basePrice: 100,
      workingPrice: 0.25
    }];

    render(
      <ContractForm
        onSubmit={mockOnSubmit}
        existingContracts={existingContracts}
      />
    );

    // Test different overlap scenarios
    const scenarios = [
      {
        start: "2025-06-01",
        end: "2026-01-01",
        description: "new contract starts during existing contract"
      },
      {
        start: "2024-06-01",
        end: "2025-06-01",
        description: "new contract ends during existing contract"
      },
      {
        start: "2024-01-01",
        end: "2026-12-31",
        description: "new contract completely overlaps existing"
      },
      {
        start: "2025-01-01",
        end: "2025-12-31",
        description: "new contract exactly matches existing"
      }
    ];

    const basePriceInput = screen.getByTestId('contract-base-price');
    const workingPriceInput = screen.getByTestId('contract-working-price');

    fireEvent.change(basePriceInput, { target: { value: "150" } });
    fireEvent.change(workingPriceInput, { target: { value: "0.30" } });

    for (const scenario of scenarios) {
      const startDateInput = screen.getByLabelText("Start");
      const endDateInput = screen.getByLabelText("End (optional)");
      
      fireEvent.change(startDateInput, { target: { value: scenario.start } });
      fireEvent.change(endDateInput, { target: { value: scenario.end } });

      const submitButton = screen.getByText("Save Contract");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(screen.getByText(/power contract already exists for this date range/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText("Cannot have overlapping contract periods")).not.toBeInTheDocument();
      });
    }
  });

  it("submits valid form data", async () => {
    render(<ContractForm onSubmit={mockOnSubmit} existingContracts={[]} />);

    const basePriceInput = screen.getByTestId('contract-base-price');
    const workingPriceInput = screen.getByTestId('contract-working-price');
    const submitButton = screen.getByText("Save Contract");

    fireEvent.change(basePriceInput, { target: { value: "150" } });
    fireEvent.change(workingPriceInput, { target: { value: "0.30" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          basePrice: 150,
          workingPrice: 0.30,
          type: "power"
        })
      );
    });
  });

  it("populates form with initial data", () => {
    render(<ContractForm onSubmit={mockOnSubmit} initialData={initialData} onCancel={mockOnCancel} existingContracts={[]} />);

    expect(screen.getByTestId('contract-base-price')).toHaveValue(100);
    expect(screen.getByTestId('contract-working-price')).toHaveValue(0.25);
    expect(screen.getByText("Update Contract")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("handles cancel button", () => {
    render(<ContractForm onSubmit={mockOnSubmit} initialData={initialData} onCancel={mockOnCancel} existingContracts={[]} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("handles validation service error", async () => {
    // Mock validateContract to throw an error
    const mockValidateContract = jest.spyOn(ContractValidationService, 'validateContract');
    mockValidateContract.mockImplementation(() => {
      throw new Error("Validation service error");
    });

    render(<ContractForm onSubmit={mockOnSubmit} existingContracts={[]} />);

    const basePriceInput = screen.getByTestId('contract-base-price');
    const workingPriceInput = screen.getByTestId('contract-working-price');
    const submitButton = screen.getByText("Save Contract");

    fireEvent.change(basePriceInput, { target: { value: "150" } });
    fireEvent.change(workingPriceInput, { target: { value: "0.30" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText("Failed to validate contract")).toBeInTheDocument();
    });

    // Clean up mock
    mockValidateContract.mockRestore();
  });
});