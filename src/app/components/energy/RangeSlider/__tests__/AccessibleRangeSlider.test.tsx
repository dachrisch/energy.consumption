import { render, screen } from "@testing-library/react";
import AccessibleRangeSlider from "../AccessibleRangeSlider";

describe("AccessibleRangeSlider", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    min: 0,
    max: 100,
    value: [20, 80] as [number, number],
    onChange: mockOnChange,
  };

  it("renders both handles", () => {
    render(<AccessibleRangeSlider {...defaultProps} />);
    const handles = screen.getAllByRole("slider");
    expect(handles).toHaveLength(2);
  });

  it("has correct accessibility labels", () => {
    render(<AccessibleRangeSlider {...defaultProps} />);
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("sets correct initial values", () => {
    render(<AccessibleRangeSlider {...defaultProps} />);
    const handles = screen.getAllByRole("slider");
    expect(handles[0]).toHaveAttribute("aria-valuenow", "20");
    expect(handles[1]).toHaveAttribute("aria-valuenow", "80");
  });
});
