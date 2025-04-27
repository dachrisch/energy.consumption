import { TimeSeries } from "@/lib/pond/timeseries";
import { timeEvent } from "@/lib/pond/event";
import { time } from "@/lib/pond/time";
import Immutable from "immutable";
import { differences } from "../timeSeries";

describe("Time Series calculations", () => {
  it("should compute month-over-month differences correctly", () => {
    // Arrange: Create a simple test TimeSeries
    const events = Immutable.List([
      timeEvent(time("2024-01-31"), Immutable.Map({ amount: 100 })),
      timeEvent(time("2024-02-29"), Immutable.Map({ amount: 150 })),
      timeEvent(time("2024-03-31"), Immutable.Map({ amount: 180 })),
    ]);

    const series = new TimeSeries({
      name: "test_energy",
      events,
    });

    // Act: Compute differences
    const diffSeries = differences(series);


    expect(diffSeries.size()).toBe(3);
    expect(diffSeries.at(0).get("amount")).toBe(100);
    expect(diffSeries.at(1).get("amount")).toBe(50);
    expect(diffSeries.at(2).get("amount")).toBe(30);
  });

  it("should handle null values gracefully", () => {
    const events = Immutable.List([
      timeEvent(time("2024-01-31"), Immutable.Map({ amount: 100 })),
      timeEvent(time("2024-02-29"), Immutable.Map({ amount: null })),
      timeEvent(time("2024-03-31"), Immutable.Map({ amount: 180 })),
    ]);

    const series = new TimeSeries({
      name: "test_energy_nulls",
      events,
    });

    const diffSeries = differences(series);

    expect(diffSeries.size()).toBe(3);
    expect(diffSeries.at(0).get("amount")).toBe(100);
    expect(diffSeries.at(1).get("amount")).toBeNull();
    expect(diffSeries.at(2).get("amount")).toBeNull();
  });
});
