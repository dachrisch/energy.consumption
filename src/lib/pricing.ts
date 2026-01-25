export interface Contract {
  startDate: Date;
  endDate: Date | null;
  basePrice: number;
  workingPrice: number;
}

export interface PricingParams {
  consumption: number;
  days: number;
  contract: Contract;
}

/**
 * Calculates the estimated cost for a given consumption and period based on a single contract.
 * formula: (basePrice * (days / 30.44)) + (workingPrice * consumption)
 */
export function calculateCostForContract(params: PricingParams): number {
  const months = params.days / 30.44;
  const fixedCost = params.contract.basePrice * months;
  const variableCost = params.contract.workingPrice * params.consumption;
  return fixedCost + variableCost;
}

/**
 * Find the applicable contract for a specific date.
 */
export function findContractForDate(contracts: Contract[], date: Date): Contract | null {
  return contracts.find(c => {
    const start = new Date(c.startDate);
    const end = c.endDate ? new Date(c.endDate) : new Date('2099-12-31');
    return date >= start && date <= end;
  }) || null;
}

/**
 * Projects yearly consumption based on current daily average.
 */
export function projectYearly(dailyAverage: number): number {
  return dailyAverage * 365.25;
}