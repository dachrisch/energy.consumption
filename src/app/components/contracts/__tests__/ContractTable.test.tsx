import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import ContractTable from "../ContractTable";
import { ContractType, EnergyOptions } from "../../../types";

describe("ContractTable", () => {
  const mockContracts: ContractType[] = [
    {
      _id: "1",
      userId: "user-1",
      type: "power" as EnergyOptions,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      basePrice: 100,
      workingPrice: 0.25
    },
    {
      _id: "2",
      userId: "user-1",
      type: "gas" as EnergyOptions,
      startDate: new Date("2024-06-01"),
      endDate: undefined,
      basePrice: 80,
      workingPrice: 0.18
    }
  ];

  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders table with all columns", () => {
    render(
      <ContractTable 
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );

    expect(screen.getByTestId("column-type")).toBeInTheDocument();
    expect(screen.getByTestId("column-start")).toBeInTheDocument();
    expect(screen.getByTestId("column-end")).toBeInTheDocument();
    expect(screen.getByTestId("column-base-price")).toBeInTheDocument();
    expect(screen.getByTestId("column-working-price")).toBeInTheDocument();
    expect(screen.getByTestId("column-actions")).toBeInTheDocument();
  });

  it("displays contract data correctly", () => {
    render(
      <ContractTable
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );

    // Text appears in both desktop and mobile views
    expect(screen.getAllByText("power").length).toBeGreaterThan(0);
    expect(screen.getAllByText("gas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("100.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.2500").length).toBeGreaterThan(0);
    expect(screen.getAllByText("80.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.1800").length).toBeGreaterThan(0);
  });

  it("handles sorting when column headers are clicked", () => {
    render(
      <ContractTable
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );

    // Click base price header to sort ascending (only in desktop table)
    const basePriceHeaders = screen.getAllByText("Base Price");
    fireEvent.click(basePriceHeaders[0]);
    expect(screen.getByText("Base Price ↑")).toBeInTheDocument();

    // Click again to sort descending
    fireEvent.click(screen.getByText("Base Price ↑"));
    expect(screen.getByText("Base Price ↓")).toBeInTheDocument();
  });

  it("filters contracts by type", () => {
    const { rerender } = render(
      <ContractTable
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );
    expect(screen.getAllByRole("row")).toHaveLength(3); // Header + 2 contracts

    rerender(
      <ContractTable
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="power"
      />
    );
    expect(screen.getAllByRole("row")).toHaveLength(2); // Header + 1 contract
    expect(screen.getAllByText("power").length).toBeGreaterThan(0);
    expect(screen.queryByText("gas")).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(
      <ContractTable 
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );

    fireEvent.click(screen.getAllByTestId("contract-edit-button")[0]);
    expect(mockOnEdit).toHaveBeenCalledWith(mockContracts[0]);
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <ContractTable 
        contracts={mockContracts}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );

    fireEvent.click(screen.getAllByTitle("Delete contract")[0]);
    expect(mockOnDelete).toHaveBeenCalledWith("1");
  });

  it("shows empty state with icon when no contracts", () => {
    render(
      <ContractTable
        contracts={[]}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
        typeFilter="all"
      />
    );

    expect(screen.getByText("No contracts available")).toBeInTheDocument();
  });
});