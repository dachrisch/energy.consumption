import { SourceEnergyReading } from "@/app/types";
import { ProjectionCalculationService } from "../ProjectionCalculationService";

describe("ProjectionCalculationService", () => {
  describe("calculateDailyAverage", () => {
    it("should calculate average daily consumption between two readings", () => {
      const readings: Partial<SourceEnergyReading>[] = [
        {
          date: new Date("2024-01-01T00:00:00Z"),
          amount: 1000,
        },
        {
          date: new Date("2024-01-11T00:00:00Z"),
          amount: 1100,
        },
      ];

      // 100 units / 10 days = 10 units/day
      const result = ProjectionCalculationService.calculateDailyAverage(readings as SourceEnergyReading[]);
      expect(result).toBe(10);
    });

    it("should return 0 if there are fewer than 2 readings", () => {
      const readings: Partial<SourceEnergyReading>[] = [
        {
          date: new Date("2024-01-01T00:00:00Z"),
          amount: 1000,
        },
      ];

      const result = ProjectionCalculationService.calculateDailyAverage(readings as SourceEnergyReading[]);
      expect(result).toBe(0);
    });

    it("should calculate average over multiple readings correctly (total range)", () => {
      const readings: Partial<SourceEnergyReading>[] = [
        { date: new Date("2024-01-01T00:00:00Z"), amount: 1000 },
        { date: new Date("2024-01-06T00:00:00Z"), amount: 1050 }, // 10/day for 5 days
        { date: new Date("2024-01-11T00:00:00Z"), amount: 1200 }, // 30/day for 5 days
      ];

      // Total: 200 units / 10 days = 20 units/day
      const result = ProjectionCalculationService.calculateDailyAverage(readings as SourceEnergyReading[]);
      expect(result).toBe(20);
    });
  });

  describe("calculateMonthlyAverages", () => {
    it("should calculate average daily consumption for each month", () => {
      const readings: Partial<SourceEnergyReading>[] = [
        { date: new Date("2024-01-01T00:00:00Z"), amount: 1000 },
        { date: new Date("2024-02-01T00:00:00Z"), amount: 1310 }, // Jan: 310 units / 31 days = 10 units/day
        { date: new Date("2024-03-01T00:00:00Z"), amount: 1890 }, // Feb: 580 units / 29 days = 20 units/day
      ];

      const result = ProjectionCalculationService.calculateMonthlyAverages(readings as SourceEnergyReading[]);
      
      // Jan is index 0
      expect(result[0]).toBeCloseTo(10);
      // Feb is index 1
      expect(result[1]).toBeCloseTo(20);
      // Other months should be 0 or null if no data
      expect(result[2]).toBe(0);
    });
  });

  describe("calculateProjectedCost", () => {
    it("should calculate cost based on base price and working price", () => {
      const contract: any = {
        basePrice: 120, // 120/year = 10/month = approx 0.328/day
        workingPrice: 0.35, // 0.35/unit
      };

      // 100 units * 0.35 = 35
      // 30 days of base price = (120 / 365) * 30 = approx 9.86
      // Total approx 44.86
      
      const result = ProjectionCalculationService.calculateProjectedCost(100, 30, contract);
      
      const expectedWorkingCost = 100 * 0.35;
      const expectedBaseCost = (120 / 365) * 30;
      expect(result).toBeCloseTo(expectedWorkingCost + expectedBaseCost, 2);
    });
  });
});
