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
  ytdPowerCurrent: number;
  ytdPowerPrevious: number;
  ytdGasCurrent: number;
  ytdGasPrevious: number;
  yearlyHistory: YearStats[];
}

export interface AggregateResult {
  totalYearlyCost: number;
  powerYearlyCost: number;
  gasYearlyCost: number;
}

interface HistoryOptions {
  meterReadings: { value: number; date: Date }[];
  meterContracts: Contract[];
  meterType: 'power' | 'gas';
  currentYear: number;
  yearlyStatsMap: Map<number, { cost: number; consumption: number; powerCost: number; gasCost: number }>;
}

interface ConsumptionSegment {
  startIndex: number;
  endIndex: number;
  readings: { value: number; date: Date }[];
}

/**
 * Detects meter resets by finding readings where the value decreases
 * @returns Array of indices where resets occur (pointing to the last reading before reset)
 */
function detectMeterResets(readings: { value: number; date: Date }[]): number[] {
  const resetIndices: number[] = [];
  for (let i = 0; i < readings.length - 1; i++) {
    if (readings[i + 1].value < readings[i].value) {
      // Significant decrease suggests meter reset/replacement
      resetIndices.push(i);
    }
  }
  return resetIndices;
}

/**
 * Splits readings into continuous consumption segments separated by meter resets
 * @returns Array of segments, each containing a continuous series of readings
 */
function splitReadingsIntoSegments(readings: { value: number; date: Date }[]): ConsumptionSegment[] {
  const resetIndices = detectMeterResets(readings);
  const segments: ConsumptionSegment[] = [];

  let startIdx = 0;
  for (const resetIdx of resetIndices) {
    if (startIdx <= resetIdx) {
      segments.push({
        startIndex: startIdx,
        endIndex: resetIdx,
        readings: readings.slice(startIdx, resetIdx + 1)
      });
    }
    startIdx = resetIdx + 1;
  }

  // Add final segment (from last reset to end, or all readings if no resets)
  if (startIdx < readings.length) {
    segments.push({
      startIndex: startIdx,
      endIndex: readings.length - 1,
      readings: readings.slice(startIdx)
    });
  }

  // Filter out segments with less than 2 readings (can't calculate consumption)
  return segments.filter(seg => seg.readings.length >= 2);
}

/**
 * Calculates consumption and cost for a segment within a year
 */
function calculateSegmentYearContribution(
  segment: ConsumptionSegment,
  yearStart: Date,
  yearEnd: Date,
  meterContracts: Contract[]
): { consumption: number; cost: number } | null {
  const segmentStart = segment.readings[0].date;
  const segmentEnd = segment.readings[segment.readings.length - 1].date;

  // Skip if segment doesn't overlap with year
  if (segmentEnd < yearStart || segmentStart > yearEnd) {
    return null;
  }

  // Find readings that bracket the year boundaries
  const readingsBeforeOrAtStart = segment.readings.filter(r => r.date <= yearStart);
  const readingsInYear = segment.readings.filter(r => r.date >= yearStart && r.date <= yearEnd);
  const readingsInOrBefore = segment.readings.filter(r => r.date <= yearEnd);

  if (readingsInOrBefore.length < 1) {
    return null;
  }

  // Use last reading before year start as reference, or first reading in year
  const startRef = readingsBeforeOrAtStart.length > 0
    ? readingsBeforeOrAtStart[readingsBeforeOrAtStart.length - 1]
    : (readingsInYear.length > 0 ? readingsInYear[0] : null);

  const endRef = readingsInOrBefore[readingsInOrBefore.length - 1];

  if (!startRef || !endRef || startRef === endRef) {
    return null;
  }

  const segmentConsumption = endRef.value - startRef.value;

  // Only process positive consumption (within valid segment, no resets)
  if (segmentConsumption > 0) {
    const segmentCost = calculateIntervalCost(startRef.date, endRef.date, segmentConsumption, meterContracts);
    return { consumption: segmentConsumption, cost: segmentCost };
  }

  return null;
}

function calculateHistoricalYearlyStats(options: HistoryOptions) {
  const { meterReadings, meterContracts, meterType, currentYear, yearlyStatsMap } = options;

  // Split readings into continuous consumption segments (handles meter resets)
  const segments = splitReadingsIntoSegments(meterReadings);

  // If no valid segments, skip this meter
  if (segments.length === 0) {
    return;
  }

  const firstYear = meterReadings[0].date.getFullYear();

  for (let year = firstYear; year <= currentYear; year++) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    let yearTotalConsumption = 0;
    let yearTotalCost = 0;

    // Process each consumption segment independently
    for (const segment of segments) {
      const contribution = calculateSegmentYearContribution(segment, yearStart, yearEnd, meterContracts);
      if (contribution) {
        yearTotalConsumption += contribution.consumption;
        yearTotalCost += contribution.cost;
      }
    }

    // Only add to map if we have valid data for this year
    if (yearTotalConsumption > 0 || yearTotalCost > 0) {
      const existing = yearlyStatsMap.get(year) || { cost: 0, consumption: 0, powerCost: 0, gasCost: 0 };
      yearlyStatsMap.set(year, {
        cost: existing.cost + yearTotalCost,
        consumption: existing.consumption + yearTotalConsumption,
        powerCost: existing.powerCost + (meterType === 'power' ? yearTotalCost : 0),
        gasCost: existing.gasCost + (meterType === 'gas' ? yearTotalCost : 0)
      });
    }
  }
}

function calculateYtdCosts(params: {
  now: Date;
  jan1Current: Date;
  jan1Prev: Date;
  todayPrevYear: Date;
  meterReadings: { value: number; date: Date }[];
  meterContracts: Contract[];
}) {
    const { now, jan1Current, jan1Prev, todayPrevYear, meterReadings, meterContracts } = params;
    const valJan1Current = interpolateValueAtDate(jan1Current, meterReadings);
    const valToday = interpolateValueAtDate(now, meterReadings) || meterReadings[meterReadings.length - 1].value;
    const valJan1Prev = interpolateValueAtDate(jan1Prev, meterReadings);
    const valTodayPrev = interpolateValueAtDate(todayPrevYear, meterReadings);

    let current = 0;
    let previous = 0;

    if (valJan1Current !== null && valToday !== null) {
        current = calculateIntervalCost(jan1Current, now, valToday - valJan1Current, meterContracts);
    }
    if (valJan1Prev !== null && valTodayPrev !== null) {
        previous = calculateIntervalCost(jan1Prev, todayPrevYear, valTodayPrev - valJan1Prev, meterContracts);
    }
    return { current, previous };
}

function getMeterContractsList(meterId: string, contracts: IContract[]): Contract[] {
    return (contracts as unknown as Contract[]).filter((c) => {
        const contract = c as unknown as { meterId: string | { _id: string } };
        const cId = typeof contract.meterId === 'string' ? contract.meterId : (contract.meterId as unknown as { _id: string })?._id;
        return cId?.toString() === meterId.toString();
    }).map(c => ({
        ...c,
        startDate: new Date(c.startDate),
        endDate: c.endDate ? new Date(c.endDate) : null
    }));
}

function calculateActiveYearlyCost(meter: IMeter, readings: { value: number; date: Date }[], meterContracts: Contract[], now: Date): number {
    const activeContract = meterContracts.find(c => {
        const start = c.startDate;
        const end = c.endDate || new Date('2099-12-31');
        return now >= start && now <= end;
    });

    if (!activeContract) {
        return 0;
    }

    const dailyAverage = calculateDailyAverage(readings);
    const baseCost = (activeContract.basePrice || 0) * (365.25 / 30.44);
    const workingCost = (activeContract.workingPrice || 0) * (dailyAverage * 365.25);
    const totalCost = baseCost + workingCost;

    // Ensure we return a valid number (not NaN, Infinity, or negative)
    return isNaN(totalCost) || !isFinite(totalCost) ? 0 : Math.max(0, totalCost);
}

function processMeter(params: {
    meter: IMeter;
    readings: IReading[];
    contracts: IContract[];
    now: Date;
    jan1Current: Date;
    jan1Prev: Date;
    todayPrevYear: Date;
    yearlyStatsMap: Map<number, { cost: number; consumption: number; powerCost: number; gasCost: number }>;
    currentYear: number;
}) {
    const { meter, readings, contracts, now, jan1Current, jan1Prev, todayPrevYear, yearlyStatsMap, currentYear } = params;
    const meterReadings = readings
      .filter((r) => r.meterId.toString() === meter._id.toString())
      .map((r) => ({ value: r.value, date: new Date(r.date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (meterReadings.length < 2) {
        return { powerYearlyCost: 0, gasYearlyCost: 0, ytdCostCurrent: 0, ytdCostPrevious: 0, ytdPowerCurrent: 0, ytdPowerPrevious: 0, ytdGasCurrent: 0, ytdGasPrevious: 0 };
    }

    const meterContracts = getMeterContractsList(meter._id.toString(), contracts);
    const ytd = calculateYtdCosts({ now, jan1Current, jan1Prev, todayPrevYear, meterReadings, meterContracts });
    const estimatedYearlyCost = calculateActiveYearlyCost(meter, meterReadings, meterContracts, now);

    calculateHistoricalYearlyStats({ meterReadings, meterContracts, meterType: meter.type as 'power' | 'gas', currentYear, yearlyStatsMap });

    return {
        powerYearlyCost: meter.type === 'power' ? estimatedYearlyCost : 0,
        gasYearlyCost: meter.type === 'gas' ? estimatedYearlyCost : 0,
        ytdCostCurrent: ytd.current,
        ytdCostPrevious: ytd.previous,
        ytdPowerCurrent: meter.type === 'power' ? ytd.current : 0,
        ytdPowerPrevious: meter.type === 'power' ? ytd.previous : 0,
        ytdGasCurrent: meter.type === 'gas' ? ytd.current : 0,
        ytdGasPrevious: meter.type === 'gas' ? ytd.previous : 0
    };
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
  let ytdPowerCurrent = 0;
  let ytdPowerPrevious = 0;
  let ytdGasCurrent = 0;
  let ytdGasPrevious = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;
  const yearlyStatsMap = new Map<number, { cost: number; consumption: number; powerCost: number; gasCost: number }>();

  const jan1Current = new Date(currentYear, 0, 1);
  const jan1Prev = new Date(lastYear, 0, 1);
  const todayPrevYear = new Date(lastYear, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

  for (const meter of meters) {
    const result = processMeter({ meter, readings, contracts, now, jan1Current, jan1Prev, todayPrevYear, yearlyStatsMap, currentYear });
    powerYearlyCost += result.powerYearlyCost;
    gasYearlyCost += result.gasYearlyCost;
    ytdCostCurrent += result.ytdCostCurrent;
    ytdCostPrevious += result.ytdCostPrevious;
    ytdPowerCurrent += result.ytdPowerCurrent;
    ytdPowerPrevious += result.ytdPowerPrevious;
    ytdGasCurrent += result.ytdGasCurrent;
    ytdGasPrevious += result.ytdGasPrevious;
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
    ytdPowerCurrent,
    ytdPowerPrevious,
    ytdGasCurrent,
    ytdGasPrevious,
    yearlyHistory
  };
}
