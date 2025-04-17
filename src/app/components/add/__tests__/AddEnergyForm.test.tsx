import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddEnergyForm from "../AddEnergyForm";

describe("AddEnergyForm", () => {
  const mockOnSubmit = jest.fn();
  const defaultLatestValues = {
    power: 1000,
    gas: 500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with default values", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByTestId("add-energy-type-gas")).toBeInTheDocument();
    expect(screen.getByTestId("add-energy-type-power")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Add Energy Data")).toBeInTheDocument();
  });

  it("updates amount when type changes", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Amount");
    expect(amountInput).toHaveValue(1000); // Default power value

    const gasRadio = screen.getByLabelText("gas");
    fireEvent.click(gasRadio);

    expect(amountInput).toHaveValue(500); // Should update to gas value
  });

  it("validates amount is greater than 0", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "-1" } });

    const submitButton = screen.getByText("Add Energy Data");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Please enter a valid amount greater than 0")
    ).toBeInTheDocument();
  });

  it("shows confirmation modal when new value is lower than previous value", async () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "900" } });

    const submitButton = screen.getByText("Add Energy Data");
    fireEvent.click(submitButton);

    fireEvent.change(amountInput, { target: { value: "800" } });
    fireEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal")
      ).toBeInTheDocument();
    });
  });

  it("submits data ", async () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "1900" } });

    const submitButton = screen.getByText("Add Energy Data");
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1900,
          type: "power",
        })
      );
    });
    
  });

  it("submits data after confirmation", async () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "900" } });

    const submitButton = screen.getByText("Add Energy Data");
    fireEvent.click(submitButton);

    fireEvent.change(amountInput, { target: { value: "800" } });
    fireEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal")
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Confirm");
    fireEvent.click(cancelButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 800,
        type: "power",
      })
    );
    
  });

  it("cancels submission when modal is closed", async () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "900" } });

    const submitButton = screen.getByText("Add Energy Data");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-modal")
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
