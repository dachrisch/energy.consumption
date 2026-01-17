import { dateToPercentage, percentageToDate } from "../SliderCalculationService";

describe("SliderCalculationService - Radix Mapping", () => {
  const startDate = new Date("2024-01-01T00:00:00Z");
  const endDate = new Date("2024-01-11T00:00:00Z"); // 10 days later

  describe("dateToPercentage", () => {
    it("should return 0 for start date", () => {
      expect(dateToPercentage(startDate, startDate, endDate)).toBe(0);
    });

    it("should return 100 for end date", () => {
      expect(dateToPercentage(endDate, startDate, endDate)).toBe(100);
    });

    it("should return 50 for middle date", () => {
      const midDate = new Date("2024-01-06T00:00:00Z");
      expect(dateToPercentage(midDate, startDate, endDate)).toBe(50);
    });
  });

  describe("percentageToDate", () => {
    it("should return start date for 0%", () => {
      expect(percentageToDate(0, startDate, endDate).getTime()).toBe(startDate.getTime());
    });

    it("should return end date for 100%", () => {
      expect(percentageToDate(100, startDate, endDate).getTime()).toBe(endDate.getTime());
    });

    it("should return middle date for 50%", () => {
      const midDate = new Date("2024-01-06T00:00:00Z");
      expect(percentageToDate(50, startDate, endDate).getTime()).toBe(midDate.getTime());
    });

    it("should clamp values below 0 to start date", () => {
      expect(percentageToDate(-10, startDate, endDate).getTime()).toBe(startDate.getTime());
    });

    it("should clamp values above 100 to end date", () => {
      expect(percentageToDate(110, startDate, endDate).getTime()).toBe(endDate.getTime());
    });
  });
});
