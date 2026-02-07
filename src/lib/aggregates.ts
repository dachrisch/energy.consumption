import { calculateDailyAverage, Reading } from './consumption';
import { calculateIntervalCost, Contract } from './pricing';
import { IMeter, IReading, IContract } from '../types/models';

export interface YearStats {
  year: number;
  cost: number;
  consumption: number;
}

export interface DetailedAggregates extends AggregateResult {
  previousYearTotal: number;
  previousYearPower: number;
  previousYearGas: number;
  yearlyHistory: YearStats[];
}

export interface AggregateResult {
  totalYearlyCost: number;
  powerYearlyCost: number;
  gasYearlyCost: number;
}

export function calculateAggregates(
  meters: IMeter[],
  readings: IReading[],
  contracts: IContract[]
): AggregateResult | DetailedAggregates {
  // Logic for the basic return
  let powerYearlyCost = 0;
  let gasYearlyCost = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;

  // History tracking
  const yearlyStatsMap = new Map<number, { cost: number; consumption: number }>();

  // Process each meter
  for (const meter of meters) {
    const meterReadings = readings
      .filter((r) => r.meterId.toString() === meter._id.toString())
      .map((r) => ({
        value: r.value,
        date: new Date(r.date)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (meterReadings.length < 2) { continue; }

    const meterContracts = (contracts as unknown as Contract[]).filter((c) => {
      const contract = c as unknown as { meterId: string | { _id: string } };
      const cId = typeof contract.meterId === 'string'
        ? contract.meterId
        : (contract.meterId as unknown as { _id: string })?._id;
      return cId === meter._id.toString();
    }).map(c => ({
        ...c,
        startDate: new Date(c.startDate),
        endDate: c.endDate ? new Date(c.endDate) : null
    }));

    // CURRENT PROJECTION
    const dailyAverage = calculateDailyAverage(meterReadings);
    const yearlyProjection = dailyAverage * 365.25;
    
    const activeContract = meterContracts.find(c => {
        const start = c.startDate;
        const end = c.endDate || new Date('2099-12-31');
        return now >= start && now <= end;
    });

    if (activeContract) {
      const months = 365.25 / 30.44;
      const estimatedYearlyCost = (activeContract.basePrice * months) + (activeContract.workingPrice * yearlyProjection);
      if (meter.type === 'power') powerYearlyCost += estimatedYearlyCost;
      else if (meter.type === 'gas') gasYearlyCost += estimatedYearlyCost;
    }

    // HISTORICAL DATA (Grouped by Year)
    const firstReadingDate = meterReadings[0].date;
    const firstYear = firstReadingDate.getFullYear();
    
    for (let year = firstYear; year <= currentYear; year++) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);
        
        // Find readings within or around this year
        const yearReadings = meterReadings.filter(r => r.date.getFullYear() === year);
        if (yearReadings.length === 0) continue;

        // Simplified historical consumption: last reading of year - first reading of year (or closest)
        // More accurate: find reading closest to start and end of year
        const readingsInOrBefore = meterReadings.filter(r => r.date <= yearEnd);
        const readingsInOrAfter = meterReadings.filter(r => r.date >= yearStart);
        
        if (readingsInOrBefore.length < 2) continue;
        
        const startRef = readingsInOrAfter[0];
        const endRef = readingsInOrBefore[readingsInOrBefore.length - 1];
        
        if (startRef === endRef) continue;

        const yearConsumption = endRef.value - startRef.value;
        const yearCost = calculateIntervalCost(startRef.date, endRef.date, yearConsumption, meterContracts);
        
        const existing = yearlyStatsMap.get(year) || { cost: 0, consumption: 0 };
        yearlyStatsMap.set(year, {
            cost: existing.cost + yearCost,
            consumption: existing.consumption + yearConsumption
        });
    }
  }

  const yearlyHistory: YearStats[] = Array.from(yearlyStatsMap.entries())
    .map(([year, stats]) => ({ year, ...stats }))
    .sort((a, b) => a.year - b.year);

  const prevYearStats = yearlyStatsMap.get(lastYear);

  return {
    totalYearlyCost: powerYearlyCost + gasYearlyCost,
    powerYearlyCost,
    gasYearlyCost,
    previousYearTotal: prevYearStats?.cost || 0,
    previousYearPower: 0, // Simplified for now
    previousYearGas: 0,    // Simplified for now
    yearlyHistory
  };
}
