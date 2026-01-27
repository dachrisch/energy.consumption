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
