import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddDataPage from "../page";
import { addEnergyAction } from "@/actions/energy";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next-auth
const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

// Mock actions
jest.mock("@/actions/energy", () => ({
  addEnergyAction: jest.fn(),
  importCSVAction: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(),
  },
});

describe("AddDataPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ status: "authenticated" });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        { _id: "1", type: "power", amount: 1000, date: "2024-01-01T00:00:00.000Z", userId: "user1" },
      ],
    });
  });

  it("should redirect to login if not authenticated", () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated" });

    render(<AddDataPage />);

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should show loading state initially", () => {
    render(<AddDataPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should fetch and display energy data after loading", async () => {
    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Energy Data" })).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/energy");
  });

  it("should handle fetch error gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Energy Data" })).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should handle failed fetch response", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Energy Data" })).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should render tabs and AddEnergyForm after loading", async () => {
    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByText("Manual Entry")).toBeInTheDocument();
      expect(screen.getByText("CSV File")).toBeInTheDocument();
      expect(screen.getByText("Clipboard")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Energy Data" })).toBeInTheDocument();
    });
  });

  it("should handle successful energy data submission", async () => {
    (addEnergyAction as jest.Mock).mockResolvedValue(undefined);

    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Energy Data" })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "1500" } });

    const submitButton = screen.getByRole("button", { name: "Add Energy Data" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(addEnergyAction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1500,
          type: "power",
        })
      );
    });

    // Should show success toast
    await waitFor(() => {
      expect(screen.getByText("Energy data added successfully")).toBeInTheDocument();
    });

    // Should redirect after 1 second
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    }, { timeout: 1500 });
  });

  it("should handle energy data submission error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    (addEnergyAction as jest.Mock).mockRejectedValue(new Error("Failed to add"));

    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Energy Data" })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "1500" } });

    const submitButton = screen.getByRole("button", { name: "Add Energy Data" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to add energy data")).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // CSV import tests are complex due to modal interactions - covered by CSVDropZone tests

  it("should close toast when close button is clicked", async () => {
    (addEnergyAction as jest.Mock).mockResolvedValue(undefined);

    render(<AddDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Energy Data" })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "1500" } });

    const submitButton = screen.getByRole("button", { name: "Add Energy Data" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Energy data added successfully")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Energy data added successfully")).not.toBeInTheDocument();
    });
  });
});
