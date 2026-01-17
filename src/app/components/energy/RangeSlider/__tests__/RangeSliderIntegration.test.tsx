import { render, screen, fireEvent, act } from "@testing-library/react";
import RangeSlider from "../RangeSlider";
import { DateRange } from "../types";

// Mock AccessibleRangeSlider to easily trigger changes
jest.mock("../AccessibleRangeSlider", () => {
  return function MockAccessibleSlider({ onChange }: any) {
    return (
      <button 
        data-testid="mock-slider" 
        onClick={() => onChange([10, 90])}
      >
        Trigger Change
      </button>
    );
  };
});

describe("RangeSlider Debounce Integration", () => {
  const minDate = new Date("2024-01-01T00:00:00Z");
  const maxDate = new Date("2024-01-11T00:00:00Z"); // 10 days
  const initialRange: DateRange = { start: minDate, end: maxDate };
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls onDateRangeChange after a debounce delay", () => {
    const dummyData = [
      { id: "1", date: minDate, type: "power", amount: 100 },
    ] as any;

    render(
      <RangeSlider
        data={dummyData}
        dateRange={initialRange}
        onDateRangeChange={mockOnChange}
        minDate={minDate}
        maxDate={maxDate}
      />
    );

    const trigger = screen.getByTestId("mock-slider");
    
    // Trigger change
    fireEvent.click(trigger);

    // Should not be called immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should be called now
    expect(mockOnChange).toHaveBeenCalled();
    const resultRange = mockOnChange.mock.calls[0][0];
    
    // 10% of 10 days is 1 day. Jan 1 + 1 day = Jan 2.
    expect(resultRange.start.toISOString()).toBe(new Date("2024-01-02T00:00:00Z").toISOString());
    // 90% of 10 days is 9 days. Jan 1 + 9 days = Jan 10.
    expect(resultRange.end.toISOString()).toBe(new Date("2024-01-10T00:00:00Z").toISOString());
  });
});
