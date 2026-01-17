import { render, screen } from "@testing-library/react";
import ProjectionCard from "../ProjectionCard";
import { ProjectionResult } from "@/services/projections/ProjectionService";

describe("ProjectionCard", () => {
  const mockProjection: ProjectionResult = {
    currentMonth: {
      actual: 100,
      projected: 50,
      estimatedTotal: 150,
      estimatedCost: 15.5,
      daysRemaining: 15,
    },
    year: {
      actualToDate: 1000,
      projectedRemainder: 500,
      estimatedTotal: 1500,
      estimatedCost: 155,
    },
  };

  it("should render current month metrics", () => {
    render(<ProjectionCard projection={mockProjection} type="power" />);

    expect(screen.getByText("Estimated Monthly Bill")).toBeInTheDocument();
    expect(screen.getByText("€15.50")).toBeInTheDocument();
    expect(screen.getByText(/150.00 kWh/)).toBeInTheDocument();
  });

  it("should render year metrics", () => {
    render(<ProjectionCard projection={mockProjection} type="power" />);

    expect(screen.getByText("Full Year Projection")).toBeInTheDocument();
    expect(screen.getByText("€155.00")).toBeInTheDocument();
    expect(screen.getByText(/1,500.00 kWh/)).toBeInTheDocument();
  });

  it("should show 'Insufficient data' when projection is null", () => {
    render(<ProjectionCard projection={null} type="power" />);
    expect(screen.getByText("Insufficient data for projection")).toBeInTheDocument();
  });

  it("should handle gas units (m³)", () => {
    render(<ProjectionCard projection={mockProjection} type="gas" />);
    expect(screen.getByText(/150.00 m³/)).toBeInTheDocument();
  });
});
