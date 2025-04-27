import { EnergyBase } from "@/app/types";
import { interpolateMonthly } from "../interpolation";
import { endOfMonth } from "date-fns";

describe("Interpolate values for energy data", () => {
  it("aggregates monthly energy data", () => {
    const sampleData: EnergyBase[] = [
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
    ];

    const series = interpolateMonthly(sampleData);

    expect(series.size()).toBe(5);

    expect(series.at(0).timestamp()).toStrictEqual(new Date("2024-04-01T10:00:00Z"));
    expect(series.at(0).get("amount")).toBe(100);

    expect(series.at(1).timestamp()).toStrictEqual(endOfMonth(new Date("2024-04-01T00:00:00Z")));
    expect(series.at(1).get("amount")).toBe(148.82758618773946);

    expect(series.at(2).timestamp()).toStrictEqual(new Date("2024-05-01T15:00:00Z"));
    expect(series.at(2).get("amount")).toBe(150);

    expect(series.at(3).timestamp()).toStrictEqual(endOfMonth(new Date("2024-05-01T00:00:00Z")));
    expect(series.at(3).get("amount")).toBe(197.64089120066987);

    expect(series.at(4).timestamp()).toStrictEqual(new Date("2024-06-02T10:00:00Z"));
    expect(series.at(4).get("amount")).toBe(200);
  });
});
