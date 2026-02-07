import { calculateDailyAverage, interpolateValueAtDate } from './consumption';
import { calculateIntervalCost, Contract } from './pricing';
import { IMeter, IReading, IContract } from '../types/models';

export interface YearStats {
  year: number;
  cost: number;
  consumption: number;
  powerCost: number;
  gasCost: number;
}

export interface DetailedAggregates extends AggregateResult {
  previousYearTotal: number;
  previousYearPower: number;
  previousYearGas: number;
  ytdCostCurrent: number;
  ytdCostPrevious: number;
  yearlyHistory: YearStats[];
}

export interface AggregateResult {
  totalYearlyCost: number;
  powerYearlyCost: number;
  gasYearlyCost: number;
}

function calculateHistoricalYearlyStats(
  meterReadings: { value: number; date: Date }[],
  meterContracts: Contract[],
  meterType: 'power' | 'gas',
  currentYear: number,
  yearlyStatsMap: Map<number, { cost: number; consumption: number; powerCost: number; gasCost: number }>
) {
  const firstReadingDate = meterReadings[0].date;
  const firstYear = firstReadingDate.getFullYear();
  
  for (let year = firstYear; year <= currentYear; year++) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);
    
    const readingsInOrBefore = meterReadings.filter(r => r.date <= yearEnd);
    const readingsInOrAfter = meterReadings.filter(r => r.date >= yearStart);
    
    if (readingsInOrBefore.length < 2 || readingsInOrAfter.length === 0) { continue; }
    
    const startRef = readingsInOrAfter[0];
    const endRef = readingsInOrBefore[readingsInOrBefore.length - 1];
    
    if (startRef === endRef) { continue; }

    const yearConsumption = endRef.value - startRef.value;
    const yearCost = calculateIntervalCost(startRef.date, endRef.date, yearConsumption, meterContracts);
    
    const existing = yearlyStatsMap.get(year) || { cost: 0, consumption: 0, powerCost: 0, gasCost: 0 };
    yearlyStatsMap.set(year, {
      cost: existing.cost + Math.max(0, yearCost),
      consumption: existing.consumption + Math.max(0, yearConsumption),
      powerCost: existing.powerCost + (meterType === 'power' ? Math.max(0, yearCost) : 0),
      gasCost: existing.gasCost + (meterType === 'gas' ? Math.max(0, yearCost) : 0)
    });
  }
}

export function calculateAggregates(
  meters: IMeter[],
  readings: IReading[],
  contracts: IContract[]
): AggregateResult | DetailedAggregates {
  let powerYearlyCost = 0;
  let gasYearlyCost = 0;
  let ytdCostCurrent = 0;
  let ytdCostPrevious = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;
  const yearlyStatsMap = new Map<number, { cost: number; consumption: number; powerCost: number; gasCost: number }>();

  // Dates for YTD calculation
  const jan1Current = new Date(currentYear, 0, 1);
  const jan1Prev = new Date(lastYear, 0, 1);
  const todayPrevYear = new Date(lastYear, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

  for (const meter of meters) {
    const meterReadings = readings
      .filter((r) => r.meterId.toString() === meter._id.toString())
      .map((r) => ({ value: r.value, date: new Date(r.date) }))
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

    // YTD Logic
    const valJan1Current = interpolateValueAtDate(jan1Current, meterReadings);
    const valToday = interpolateValueAtDate(now, meterReadings) || meterReadings[meterReadings.length - 1].value;
    const valJan1Prev = interpolateValueAtDate(jan1Prev, meterReadings);
    const valTodayPrev = interpolateValueAtDate(todayPrevYear, meterReadings);

    if (valJan1Current !== null && valToday !== null) {
        ytdCostCurrent += calculateIntervalCost(jan1Current, now, valToday - valJan1Current, meterContracts);
    }
    if (valJan1Prev !== null && valTodayPrev !== null) {
        ytdCostPrevious += calculateIntervalCost(jan1Prev, todayPrevYear, valTodayPrev - valJan1Prev, meterContracts);
    }

    const dailyAverage = calculateDailyAverage(meterReadings);
    const yearlyProjection = dailyAverage * 365.25;
    
    const activeContract = meterContracts.find(c => {
        const start = c.startDate;
        const end = c.endDate || new Date('2099-12-31');
        return now >= start && now <= end;
    });

    if (activeContract) {
      const estimatedYearlyCost = (activeContract.basePrice * (365.25 / 30.44)) + (activeContract.workingPrice * yearlyProjection);
      if (meter.type === 'power') { powerYearlyCost += estimatedYearlyCost; }
      else if (meter.type === 'gas') { gasYearlyCost += estimatedYearlyCost; }
    }

    calculateHistoricalYearlyStats(meterReadings, meterContracts, meter.type as 'power' | 'gas', currentYear, yearlyStatsMap);
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
    previousYearPower: prevYearStats?.powerCost || 0,
    previousYearGas: prevYearStats?.gasCost || 0,
    ytdCostCurrent,
    ytdCostPrevious,
    yearlyHistory
  };
}
