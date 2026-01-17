import { SourceEnergyReading } from "@/app/types";

/**
 * Projection Calculation Service
 * 
 * Provides logic for estimating future energy consumption and costs.
 */
export class ProjectionCalculationService {
  /**
   * Calculate average daily consumption between the earliest and latest readings.
   * 
   * Algorithm: (Latest Amount - Earliest Amount) / (Days between Readings)
   * 
   * @param readings - Source energy readings (must be of same type)
   * @returns Average units per day, or 0 if fewer than 2 readings
   */
  static calculateDailyAverage(readings: SourceEnergyReading[]): number {
    if (readings.length < 2) {
      return 0;
    }

    // Sort readings by date to find first and last
    const sortedReadings = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const firstReading = sortedReadings[0];
    const lastReading = sortedReadings[sortedReadings.length - 1];

    const consumptionDiff = lastReading.amount - firstReading.amount;
    const timeDiffMs = lastReading.date.getTime() - firstReading.date.getTime();
    
    if (timeDiffMs === 0) {
      return 0;
    }

    const daysDiff = timeDiffMs / (1000 * 60 * 60 * 24);
    
    return consumptionDiff / daysDiff;
  }

  /**
   * Calculate average daily consumption for each month of the year.
   * 
   * @param readings - Source energy readings
   * @returns Array of 12 numbers representing average daily consumption for Jan-Dec
   */
  static calculateMonthlyAverages(readings: SourceEnergyReading[]): number[] {
    const monthlyTotals = new Array(12).fill(0).map(() => ({ totalConsumption: 0, totalDays: 0 }));

    if (readings.length < 2) {
      return new Array(12).fill(0);
    }

    const sortedReadings = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 0; i < sortedReadings.length - 1; i++) {
      const start = sortedReadings[i];
      const end = sortedReadings[i + 1];
      
      const totalConsumption = end.amount - start.amount;
      const totalTimeMs = end.date.getTime() - start.date.getTime();
      
      if (totalTimeMs <= 0) continue;

      const dailyRate = totalConsumption / (totalTimeMs / (1000 * 60 * 60 * 24));

      // Simple day-by-day distribution for accuracy
      let current = new Date(start.date);
      const endMs = end.date.getTime();

      // Simple day-by-day distribution for accuracy
      while (current.getTime() < endMs) {
        const month = current.getUTCMonth();
        const nextDay = new Date(current);
        nextDay.setUTCDate(current.getUTCDate() + 1);
        nextDay.setUTCHours(0, 0, 0, 0);

        const chunkEndMs = Math.min(nextDay.getTime(), endMs);
        const chunkDurationDays = (chunkEndMs - current.getTime()) / (1000 * 60 * 60 * 24);

        monthlyTotals[month].totalConsumption += dailyRate * chunkDurationDays;
        monthlyTotals[month].totalDays += chunkDurationDays;

        current = new Date(chunkEndMs);
      }
    }

    return monthlyTotals.map(m => m.totalDays > 0 ? m.totalConsumption / m.totalDays : 0);
  }

  /**
   * Calculate projected cost for a given amount of units and days.
   * 
   * @param units - Projected units (kWh or m³)
   * @param days - Number of days the projection covers
   * @param contract - Active contract for pricing
   * @returns Projected cost
   */
  static calculateProjectedCost(
    units: number,
    days: number,
    contract: { basePrice: number; workingPrice: number }
  ): number {
    const workingCost = units * contract.workingPrice;
    const baseCost = (contract.basePrice / 365) * days;
    return workingCost + baseCost;
  }
}
