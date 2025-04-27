import { EnergyData } from "@/app/types";
import { interpolateMonthly } from "../interpolation";
import { endOfMonth } from "date-fns";

describe("Interpolate values for energy data", () => {
  it("aggregates monthly energy data by type", () => {
    const sampleData: EnergyData = [
      {
        date: new Date("2024-04-01T10:00:00Z"),
        type: "power",
        amount: 100,
      },
      {
        date: new Date("2024-05-01T15:00:00Z"),
        type: "power",
        amount: 150,
      },
      {
        date: new Date("2024-06-02T10:00:00Z"),
        type: "power",
        amount: 200,
      },
      {
        date: new Date("2024-04-15T08:00:00Z"),
        type: "gas",
        amount: 50,
      },
      {
        date: new Date("2024-05-20T12:00:00Z"),
        type: "gas",
        amount: 75,
      },
    ];

    const seriesByType = interpolateMonthly(sampleData);

    // Test power series
    const powerSeries = seriesByType.power;
    expect(powerSeries.size()).toBe(5);
    expect(powerSeries.at(0).get("amount")).toBe(100);
    expect(powerSeries.at(1).timestamp()).toStrictEqual(endOfMonth(new Date("2024-04-01T00:00:00Z")));
    expect(powerSeries.at(1).get("amount")).toBeCloseTo(148.83, 2);
    expect(powerSeries.at(2).get("amount")).toBe(150);
    expect(powerSeries.at(3).get("amount")).toBeCloseTo(197.64, 2);
    expect(powerSeries.at(3).timestamp()).toStrictEqual(endOfMonth(new Date("2024-05-01T00:00:00Z")));
    expect(powerSeries.at(4).get("amount")).toBe(200);

    // Test gas series
    const gasSeries = seriesByType.gas;
    expect(gasSeries.size()).toBe(3);
    expect(gasSeries.at(0).get("amount")).toBe(50);
    expect(gasSeries.at(1).get("amount")).toBeCloseTo(61.078, 2);
    expect(gasSeries.at(1).timestamp()).toStrictEqual(endOfMonth(new Date("2024-04-01T00:00:00Z")));
    expect(gasSeries.at(2).get("amount")).toBe(75);
  });
});
