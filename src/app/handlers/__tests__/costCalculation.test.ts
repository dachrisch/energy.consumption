import { getAvailableYears, calculateCosts, CostPeriod } from "../costCalculation";
import { EnergyType, ContractType } from "@/app/types";

describe("costCalculation", () => {
  describe("getAvailableYears", () => {
    it("returns empty array when no energy data", () => {
      const result = getAvailableYears([]);
      expect(result).toEqual([]);
    });

    it("returns unique years from energy data in descending order", () => {
      const energyData: EnergyType[] = [
        { _id: "1", date: new Date("2023-01-15"), type: "power", amount: 100, userId: "user1" },
        { _id: "2", date: new Date("2024-05-20"), type: "gas", amount: 50, userId: "user1" },
        { _id: "3", date: new Date("2023-12-31"), type: "power", amount: 150, userId: "user1" },
        { _id: "4", date: new Date("2022-03-10"), type: "gas", amount: 75, userId: "user1" },
      ];

      const result = getAvailableYears(energyData);
      expect(result).toEqual([2024, 2023, 2022]);
    });

    it("handles duplicate years correctly", () => {
      const energyData: EnergyType[] = [
        { _id: "1", date: new Date("2023-01-15"), type: "power", amount: 100, userId: "user1" },
        { _id: "2", date: new Date("2023-05-20"), type: "gas", amount: 50, userId: "user1" },
        { _id: "3", date: new Date("2023-12-31"), type: "power", amount: 150, userId: "user1" },
      ];

      const result = getAvailableYears(energyData);
      expect(result).toEqual([2023]);
    });
  });

  describe("calculateCosts", () => {
    const createEnergyReading = (
      date: string,
      type: "power" | "gas",
      amount: number
    ): EnergyType => ({
      _id: Math.random().toString(),
      date: new Date(date),
      type,
      amount,
      userId: "user1",
    });

    const createContract = (
      type: "power" | "gas",
      startDate: string,
      endDate: string | null,
      basePrice: number,
      workingPrice: number
    ): ContractType => ({
      _id: Math.random().toString(),
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      basePrice,
      workingPrice,
      userId: "user1",
    });

    it("returns empty array when no energy data and no year/yearRange specified", () => {
      const result = calculateCosts([], [], "monthly");
      expect(result).toEqual([]);
    });

    it("calculates monthly costs correctly", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2023-12-31", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
        createEnergyReading("2024-02-29", "power", 1200),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2023-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      expect(result.length).toBeGreaterThanOrEqual(2);

      // Find January and February data
      const januaryData = result.find(d => d.period === "2024-01");
      const februaryData = result.find(d => d.period === "2024-02");

      expect(januaryData).toBeDefined();
      expect(februaryData).toBeDefined();

      if (januaryData) {
        // January: consumption = 1100 - 1000 = 100, cost = 10 + (100 * 0.25) = 35
        expect(januaryData.costs.power).toBe(35);
        expect(januaryData.totalCost).toBe(35);
      }

      if (februaryData) {
        // February: consumption = 1200 - 1100 = 100, cost = 10 + (100 * 0.25) = 35
        expect(februaryData.costs.power).toBe(35);
        expect(februaryData.totalCost).toBe(35);
      }
    });

    it("calculates yearly costs correctly", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2023-01-01", "power", 1000),
        createEnergyReading("2023-12-31", "power", 2000),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2023-01-01", null, 120, 0.30),
      ];

      const result = calculateCosts(energyData, contracts, "yearly");

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].period).toBe("2023");

      // Yearly cost should be calculated
      expect(result[0].totalCost).toBeGreaterThan(0);
    });

    it("handles multiple energy types", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2023-12-31", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
        createEnergyReading("2023-12-31", "gas", 500),
        createEnergyReading("2024-01-31", "gas", 550),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2023-01-01", null, 10, 0.25),
        createContract("gas", "2023-01-01", null, 5, 0.50),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      expect(result.length).toBeGreaterThanOrEqual(1);
      const januaryData = result.find(d => d.period === "2024-01");

      expect(januaryData).toBeDefined();
      if (januaryData) {
        // Both energy types should have costs
        expect(januaryData.costs.power).toBeGreaterThan(0);
        expect(januaryData.costs.gas).toBeGreaterThan(0);
        expect(januaryData.totalCost).toBe(januaryData.costs.power + januaryData.costs.gas);
      }
    });

    it("handles missing contracts", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-01", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
      ];

      const contracts: ContractType[] = [];

      const result = calculateCosts(energyData, contracts, "monthly");

      expect(result.length).toBeGreaterThanOrEqual(1);
      // Without contracts, costs should be 0
      expect(result[0].costs.power).toBe(0);
      expect(result[0].totalCost).toBe(0);
    });

    it("fills all months when year is specified", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-01", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", { year: 2024 });

      // Should have all 12 months
      expect(result.length).toBe(12);
      expect(result[0].period).toBe("2024-01");
      expect(result[11].period).toBe("2024-12");
    });

    it("includes extrapolation by default", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-01", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
        createEnergyReading("2024-02-01", "power", 1100),
        createEnergyReading("2024-02-29", "power", 1200),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: true,
      });

      // Should include extrapolated future periods
      const hasExtrapolated = result.some(d => d.isExtrapolated === true);
      expect(hasExtrapolated).toBe(true);
    });

    it("excludes extrapolation when disabled", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-01", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      // Should not include extrapolated periods
      const hasExtrapolated = result.some(d => d.isExtrapolated === true);
      expect(hasExtrapolated).toBe(false);
    });

    it("handles contract changes mid-period", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2023-12-31", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2023-01-01", "2024-01-15", 10, 0.25),
        createContract("power", "2024-01-16", null, 15, 0.30),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      expect(result.length).toBeGreaterThanOrEqual(1);
      const januaryData = result.find(d => d.period === "2024-01");

      expect(januaryData).toBeDefined();
      if (januaryData) {
        // Should use the contract with maximum overlap and have a cost
        expect(januaryData.totalCost).toBeGreaterThan(0);
      }
    });

    it("includes breakdown information", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2023-12-31", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1100),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2023-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      expect(result.length).toBeGreaterThanOrEqual(1);
      const januaryData = result.find(d => d.period === "2024-01");

      expect(januaryData).toBeDefined();
      if (januaryData) {
        expect(januaryData.breakdown).toBeDefined();
        expect(januaryData.breakdown!.power).toBeDefined();
        expect(januaryData.breakdown!.power.consumption).toBeGreaterThan(0);
        expect(januaryData.breakdown!.power.basePrice).toBe(10);
        expect(januaryData.breakdown!.power.workingPrice).toBe(0.25);
      }
    });

    it("handles yearRange for yearly view", () => {
      const currentYear = new Date().getFullYear();
      const energyData: EnergyType[] = [
        createEnergyReading(`${currentYear - 1}-01-01`, "power", 1000),
        createEnergyReading(`${currentYear - 1}-12-31`, "power", 2000),
      ];

      const contracts: ContractType[] = [
        createContract("power", `${currentYear - 2}-01-01`, null, 120, 0.30),
      ];

      const result = calculateCosts(energyData, contracts, "yearly", {
        yearRange: { past: 1, future: 1 },
      });

      // Should include past and future years
      expect(result.length).toBeGreaterThan(1);
    });

    it("handles single reading (no consumption)", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-15", "power", 1000),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly");

      // With single reading, can't calculate consumption
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("handles readings on same date", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-15", "power", 1000),
        createEnergyReading("2024-01-15", "power", 1100),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly");

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("sorts results by period", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-03-01", "power", 1000),
        createEnergyReading("2024-03-31", "power", 1100),
        createEnergyReading("2024-01-01", "power", 900),
        createEnergyReading("2024-01-31", "power", 1000),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      // Results should be sorted chronologically
      for (let i = 1; i < result.length; i++) {
        expect(result[i].periodStart.getTime()).toBeGreaterThanOrEqual(
          result[i - 1].periodStart.getTime()
        );
      }
    });

    it("handles zero consumption correctly", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-01", "power", 1000),
        createEnergyReading("2024-01-31", "power", 1000), // Same reading, no consumption
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly");

      expect(result.length).toBeGreaterThanOrEqual(1);
      // Zero consumption should result in zero cost
      expect(result[0].costs.power).toBe(0);
    });

    it("interpolates missing periods between data points", () => {
      const energyData: EnergyType[] = [
        createEnergyReading("2024-01-01", "power", 1000),
        createEnergyReading("2024-02-01", "power", 1100),
        // Skip March
        createEnergyReading("2024-04-01", "power", 1100),
        createEnergyReading("2024-05-01", "power", 1200),
      ];

      const contracts: ContractType[] = [
        createContract("power", "2024-01-01", null, 10, 0.25),
      ];

      const result = calculateCosts(energyData, contracts, "monthly", {
        includeExtrapolation: false,
      });

      // Should have January, February, March (may be interpolated if no data), April
      expect(result.length).toBeGreaterThanOrEqual(3);

      const marchData = result.find(d => d.period === "2024-03");
      // March might be interpolated or might just have zero costs
      expect(marchData).toBeDefined();
    });
  });
});
