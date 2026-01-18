import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../page";

// Mock mongoose (cannot be tested with js-dom https://mongoosejs.com/docs/jest.html)
jest.mock("@/actions/energy", () => ({
  deleteEnergyAction: jest.fn(),
}));

// Mock next/navigation useRouter
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock projections action
jest.mock('@/actions/projections', () => ({
  getProjectionsAction: jest.fn().mockResolvedValue(null),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and displays energy data correctly", async () => {
    // Arrange — mock fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { _id: "1", date: "2024-05-01T00:00:00.000Z", value: 100 },
      ],
    });

    // Act — render component
    render(<Dashboard />);

    // Assert loading state
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();

    // Wait for fetch and component to update
    await waitFor(() =>
      expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument()
    );

    // Assert that DashboardTabs rendered — assuming it shows a known piece of text when given data
    // Replace 'Energy Data' with any string your DashboardTabs renders with data
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  it("handles fetch errors gracefully", async () => {
    // Arrange — mock failed fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<Dashboard />);

    // Wait for error state
    await waitFor(() =>
      expect(screen.getByText(/failed to load energy data/i)).toBeInTheDocument()
    );
  });
});
