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
 * Find the applicable contract for a specific date, with fallback to the most recent expired contract.
 */
export function findActiveOrLastContract(contracts: Contract[], date: Date): Contract | null {
  const active = findContractForDate(contracts, date);
  if (active) {return active;}

  if (contracts.length === 0) {return null;}

  return [...contracts]
    .filter(c => new Date(c.startDate) <= date)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0] || null;
}

export interface MeterStats {
  dailyAverage: number;
  yearlyProjection: number;
  estimatedYearlyCost: number;
  dailyCost: number;
}

/**
 * Unified calculation for meter statistics used across the application.
 */
export function calculateMeterStats(readings: { value: number; date: Date }[], contracts: Contract[]): MeterStats {
  if (readings.length < 2) {
    return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 };
  }

  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Basic consumption: last - first (handles most cases, resets are handled by dailyAverage in consumption.ts but here we do a simple version)
  // To match calculateDailyAverage exactly, we should sum positive deltas.
  let totalConsumption = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalConsumption += Math.max(0, sorted[i].value - sorted[i - 1].value);
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);
  
  const dailyAverage = days > 0 ? totalConsumption / days : 0;
  const yearlyProjection = dailyAverage * 365.25;

  const activeContract = findActiveOrLastContract(contracts, new Date());
  
  let estimatedYearlyCost = 0;
  let dailyCost = 0;
  
  if (activeContract) {
    estimatedYearlyCost = calculateCostForContract({
      consumption: yearlyProjection,
      days: 365.25,
      contract: activeContract
    });
    
    const dailyBase = (Number(activeContract.basePrice) || 0) / 30.44;
    const dailyWorking = (Number(activeContract.workingPrice) || 0) * dailyAverage;
    dailyCost = dailyBase + dailyWorking;
  }

  return { dailyAverage, yearlyProjection, estimatedYearlyCost, dailyCost };
}

/**

 * Projects yearly consumption based on current daily average.

 */

export function projectYearly(dailyAverage: number): number {

  return dailyAverage * 365.25;

}



/**

 * Calculates the cost for a specific interval, potentially spanning multiple contracts.

 * Assumes linear consumption distribution across the interval.

 */

export function calculateIntervalCost(startDate: Date, endDate: Date, consumption: number, contracts: Contract[]): number {

  const totalMs = endDate.getTime() - startDate.getTime();

  const totalDays = totalMs / (1000 * 60 * 60 * 24);

  if (totalDays <= 0) {return 0;}



  const dailyConsumption = consumption / totalDays;

  let totalCost = 0;



    for (const contract of contracts) {



      const cStart = new Date(contract.startDate);



      // Set cEnd to the end of the day (23:59:59.999) to be inclusive



      const cEnd = contract.endDate 



        ? new Date(new Date(contract.endDate).getTime() + 24 * 60 * 60 * 1000) 



        : new Date('2099-12-31');



  



      // Intersection of [startDate, endDate] and [cStart, cEnd]



  

    const intersectStart = new Date(Math.max(startDate.getTime(), cStart.getTime()));

    const intersectEnd = new Date(Math.min(endDate.getTime(), cEnd.getTime()));



    if (intersectStart < intersectEnd) {

      const intersectMs = intersectEnd.getTime() - intersectStart.getTime();

      const intersectDays = intersectMs / (1000 * 60 * 60 * 24);

      

      const months = intersectDays / 30.44;

      const fixed = contract.basePrice * months;

      const variable = contract.workingPrice * (dailyConsumption * intersectDays);

      totalCost += fixed + variable;

    }

  }



  return totalCost;

}
