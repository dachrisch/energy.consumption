import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContractForm from "../ContractForm";
import { EnergyOptions } from "@/app/types";

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
    render(<ContractForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Base Price (per year)")).toBeInTheDocument();
    expect(screen.getByLabelText("Working Price (per unit)")).toBeInTheDocument();
    expect(screen.getByText("power")).toBeInTheDocument();
    expect(screen.getByText("gas")).toBeInTheDocument();
    expect(screen.getByText("Save Contract")).toBeInTheDocument();
  });

  it("handles type selection", () => {
    render(<ContractForm onSubmit={mockOnSubmit} />);

    const gasRadio = screen.getByText("gas");
    fireEvent.click(gasRadio);

    expect(screen.getByText("gas").closest("label")).toHaveClass("button-primary");
    expect(screen.getByText("power").closest("label")).not.toHaveClass("button-primary");
  });

  it("validates prices must be positive", () => {
    render(<ContractForm onSubmit={mockOnSubmit} />);
    const workingPriceInput = screen.getByLabelText("Working Price (per unit)");
    fireEvent.change(workingPriceInput, { target: { value: "1" } });

    const basePriceInput = screen.getByLabelText("Base Price (per year)");
    fireEvent.change(basePriceInput, { target: { value: "-10" } });

    const submitButton = screen.getByText("Save Contract");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Prices must be positive numbers")).toBeInTheDocument();
  });

  it("validates end date must be after start date", () => {
    render(<ContractForm onSubmit={mockOnSubmit} />);

    const basePriceInput = screen.getByLabelText("Base Price (per year)");
    const workingPriceInput = screen.getByLabelText("Working Price (per unit)");

    fireEvent.change(basePriceInput, { target: { value: "150" } });
    fireEvent.change(workingPriceInput, { target: { value: "0.30" } });

    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date (optional)");

    fireEvent.change(startDateInput, { target: { value: "2025-12-31" } });
    fireEvent.change(endDateInput, { target: { value: "2025-01-01" } });

    const submitButton = screen.getByText("Save Contract");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("End date must be after start date")).toBeInTheDocument();
  });

  it("prevents overlapping contracts for same type", async () => {
    // Mock fetch to return existing contract
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([{
        _id: "1",
        type: "power",
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-12-31T00:00:00.000Z"
      }])
    });

    render(<ContractForm onSubmit={mockOnSubmit} />);

    // Set dates that overlap with existing contract
    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date (optional)");
    fireEvent.change(startDateInput, { target: { value: "2025-06-01" } });
    fireEvent.change(endDateInput, { target: { value: "2026-01-01" } });

    const submitButton = screen.getByText("Save Contract");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText("Cannot have overlapping contract periods for the same energy type")).toBeInTheDocument();
    });
  });

  it("submits valid form data", async () => {
    render(<ContractForm onSubmit={mockOnSubmit} />);

    const basePriceInput = screen.getByLabelText("Base Price (per year)");
    const workingPriceInput = screen.getByLabelText("Working Price (per unit)");
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
    render(<ContractForm onSubmit={mockOnSubmit} initialData={initialData} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText("Base Price (per year)")).toHaveValue(100);
    expect(screen.getByLabelText("Working Price (per unit)")).toHaveValue(0.25);
    expect(screen.getByText("Update Contract")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("handles cancel button", () => {
    render(<ContractForm onSubmit={mockOnSubmit} initialData={initialData} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});