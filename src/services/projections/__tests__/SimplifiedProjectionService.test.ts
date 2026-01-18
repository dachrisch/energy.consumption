import { SimplifiedProjectionService } from "../SimplifiedProjectionService";
import { Reading, ContractType } from "@/app/types";

describe("SimplifiedProjectionService", () => {
  const mockReadings: Reading[] = [
    {
      _id: "r1",
      meterId: "m1",
      userId: "u1",
      value: 1000,
      date: new Date("2024-01-01")
    },
    {
      _id: "r2",
      meterId: "m1",
      userId: "u1",
      value: 1100,
      date: new Date("2024-01-11") // 10 days later, 100 kWh used
    }
  ];

  const mockContract: ContractType = {
    _id: "c1",
    userId: "u1",
    type: "power",
    meterId: "m1",
    basePrice: 120, // yearly
    workingPrice: 0.30, // per kWh
    startDate: new Date("2024-01-01")
  };

  it("should calculate correct daily average and total consumption", () => {
    const result = SimplifiedProjectionService.calculateProjections("m1", mockReadings, null);
    
    expect(result).not.toBeNull();
    expect(result?.totalConsumption).toBe(100);
    expect(result?.dailyAverage).toBe(10); // 100 kWh / 10 days
    expect(result?.estimatedYearlyConsumption).toBe(3650); // 10 * 365
    expect(result?.daysTracked).toBe(10);
    expect(result?.hasContract).toBe(false);
  });

  it("should calculate correct yearly cost with contract", () => {
    const result = SimplifiedProjectionService.calculateProjections("m1", mockReadings, mockContract);
    
    expect(result).not.toBeNull();
    expect(result?.hasContract).toBe(true);
    // 120 (base) + (3650 * 0.30) = 120 + 1095 = 1215
    expect(result?.estimatedYearlyCost).toBe(1215);
  });

  it("should return null if less than 2 readings", () => {
    const result = SimplifiedProjectionService.calculateProjections("m1", [mockReadings[0]], null);
    expect(result).toBeNull();
  });
});
