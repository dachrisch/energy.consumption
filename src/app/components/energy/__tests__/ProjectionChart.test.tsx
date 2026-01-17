import { render } from "@testing-library/react";
import ProjectionChart from "../ProjectionChart";
import { ProjectionResult } from "@/services/projections/ProjectionService";

// Mock Chart.js to avoid canvas errors in JSDOM
jest.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="mock-line-chart" />,
}));

describe("ProjectionChart", () => {
  const mockProjection: ProjectionResult = {
    currentMonth: { actual: 0, projected: 0, estimatedTotal: 0, estimatedCost: 0, daysRemaining: 0 },
    year: { actualToDate: 0, projectedRemainder: 0, estimatedTotal: 0, estimatedCost: 0 },
    monthlyData: Array.from({ length: 12 }, (_, i) => ({
      month: i,
      actual: i < 5 ? 100 : null,
      projected: 110,
    })),
  };

  it("should render the chart container", () => {
    render(<ProjectionChart projection={mockProjection} type="power" />);
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });

  it("should display the chart title", () => {
    render(<ProjectionChart projection={mockProjection} type="power" />);
    expect(screen.getByText("Consumption Projection")).toBeInTheDocument();
  });
});

import { screen } from "@testing-library/react";
