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
    expect(screen.getByLabelText("Meter Reading")).toBeInTheDocument();
    expect(screen.getByText("Add Energy Data")).toBeInTheDocument();
  });

  it("updates amount when type changes", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const amountInput = screen.getByLabelText("Meter Reading");
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

    const amountInput = screen.getByLabelText("Meter Reading");
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

    const amountInput = screen.getByLabelText("Meter Reading");
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

    const amountInput = screen.getByLabelText("Meter Reading");
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

    const amountInput = screen.getByLabelText("Meter Reading");
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

    const amountInput = screen.getByLabelText("Meter Reading");
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

  it("handles missing latest values with fallback to 0", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={{ power: 0, gas: 0 }}
      />
    );

    const amountInput = screen.getByLabelText("Meter Reading") as HTMLInputElement;
    // When value is 0, number inputs show empty string
    expect(amountInput.value).toBe('');

    const gasRadio = screen.getByLabelText("gas");
    fireEvent.click(gasRadio);

    expect(amountInput.value).toBe('');
  });

  it("uses fallback value when switching to type with no previous value", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={{ power: 1000, gas: 0 }}
      />
    );

    const amountInput = screen.getByLabelText("Meter Reading") as HTMLInputElement;
    expect(amountInput.value).toBe('1000');

    const gasRadio = screen.getByLabelText("gas");
    fireEvent.click(gasRadio);

    // Should fallback to 0 when gas value is 0, which displays as empty
    expect(amountInput.value).toBe('');
  });

  it("updates date when date input changes", () => {
    render(
      <AddEnergyForm
        onSubmit={mockOnSubmit}
        latestValues={defaultLatestValues}
      />
    );

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2024-12-15" } });

    expect(dateInput.value).toBe("2024-12-15");
  });
});
