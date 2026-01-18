import { Reading, ContractType, SimplifiedProjectionResult } from "@/app/types";

export class SimplifiedProjectionService {
  /**
   * Calculate basic projections based on readings and a contract
   */
  static calculateProjections(
    meterId: string,
    readings: Reading[],
    contract: ContractType | null
  ): SimplifiedProjectionResult | null {
    if (readings.length < 2) return null;

    // Sort readings by date ascending
    const sorted = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const firstReading = sorted[0];
    const lastReading = sorted[sorted.length - 1];
    
    const totalConsumption = lastReading.value - firstReading.value;
    const timeDiffMs = new Date(lastReading.date).getTime() - new Date(firstReading.date).getTime();
    const daysTracked = Math.max(1, timeDiffMs / (1000 * 60 * 60 * 24));
    
    const dailyAverage = totalConsumption / daysTracked;
    const estimatedYearlyConsumption = dailyAverage * 365;
    
    let estimatedYearlyCost = 0;
    if (contract) {
      estimatedYearlyCost = contract.basePrice + (estimatedYearlyConsumption * contract.workingPrice);
    }

    return {
      meterId,
      totalConsumption,
      estimatedYearlyConsumption,
      estimatedYearlyCost,
      dailyAverage,
      daysTracked: Math.round(daysTracked),
      hasContract: !!contract
    };
  }
}
