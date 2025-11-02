import { TimeSeries } from "@/lib/pond/timeseries";
import { timeEvent } from "@/lib/pond/event";
import { time } from "@/lib/pond/time";
import Immutable from "immutable";
import { differences, createTimeSeriesByType } from "../timeSeries";

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

  it("should handle empty series", () => {
    const series = new TimeSeries({
      name: "empty",
      events: Immutable.List([]),
    });

    const diffSeries = differences(series);

    expect(diffSeries.size()).toBe(0);
  });

  it("should handle single event", () => {
    const events = Immutable.List([
      timeEvent(time("2024-01-31"), Immutable.Map({ amount: 100 })),
    ]);

    const series = new TimeSeries({
      name: "single_event",
      events,
    });

    const diffSeries = differences(series);

    expect(diffSeries.size()).toBe(1);
    expect(diffSeries.at(0).get("amount")).toBe(100);
  });
});

describe('createTimeSeriesByType', () => {
  it('should create time series grouped by energy type', () => {
    const energyData = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power' as const,
        amount: 1000,
        date: new Date('2024-01-01'),
      },
      {
        _id: '2',
        userId: 'user1',
        type: 'gas' as const,
        amount: 500,
        date: new Date('2024-01-01'),
      },
      {
        _id: '3',
        userId: 'user1',
        type: 'power' as const,
        amount: 1500,
        date: new Date('2024-01-02'),
      },
    ];

    const result = createTimeSeriesByType(energyData);

    expect(result.power).toBeDefined();
    expect(result.gas).toBeDefined();
    expect(result.power.size()).toBe(2);
    expect(result.gas.size()).toBe(1);
  });

  it('should handle empty energy data', () => {
    const result = createTimeSeriesByType([]);

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should handle single type data', () => {
    const energyData = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power' as const,
        amount: 1000,
        date: new Date('2024-01-01'),
      },
      {
        _id: '2',
        userId: 'user1',
        type: 'power' as const,
        amount: 1500,
        date: new Date('2024-01-02'),
      },
    ];

    const result = createTimeSeriesByType(energyData);

    expect(result.power).toBeDefined();
    expect(result.gas).toBeUndefined();
    expect(result.power.size()).toBe(2);
  });
});
