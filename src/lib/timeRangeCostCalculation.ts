import { interpolateValueAtDate, calculateDailyAverage } from './consumption';
import { calculateIntervalCost, Contract } from './pricing';
import { IMeter, IReading, IContract } from '../types/models';

export interface TimeRangeReading {
  date: Date;
  value: number;
}

export interface MeterCostBreakdown {
  meterId: string;
  meterName: string;
  meterType: 'power' | 'gas';
  unit: string;
  consumption: number;
  cost: number;
}

export interface TimeRangeCostResult {
  startDate: Date;
  endDate: Date;
  totalCost: number;
  meterBreakdowns: MeterCostBreakdown[];
  allReadingsInRange: Map<string, TimeRangeReading[]>;
}

export interface ChartDataPoint {
  x: number; // timestamp
  y: number | null; // value
}

export interface ChartDataset {
  label: string;
  meterId: string;
  meterType: 'power' | 'gas';
  actualPoints: ChartDataPoint[];
  interpolatedLine: ChartDataPoint[];
  borderColor: string;
  unit: string;
}

/**
 * Filters readings to only those within the specified date range
 */
export function filterReadingsByDateRange(
  readings: IReading[],
  meterId: string,
  startDate: Date,
  endDate: Date
): TimeRangeReading[] {
  return readings
    .filter(r => r.meterId === meterId)
    .map(r => ({ date: new Date(r.date), value: r.value }))
    .filter(r => r.date >= startDate && r.date <= endDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get all readings for a meter (for interpolation purposes)
 */
function getAllMeterReadings(readings: IReading[], meterId: string): TimeRangeReading[] {
  return readings
    .filter(r => r.meterId === meterId)
    .map(r => ({ date: new Date(r.date), value: r.value }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Extract contracts for a specific meter
 */
function getMeterContracts(meterId: string, contracts: IContract[]): Contract[] {
  return contracts
    .filter(c => {
      const cMeterId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
      return cMeterId === meterId;
    })
    .map(c => ({
      startDate: new Date(c.startDate),
      endDate: c.endDate ? new Date(c.endDate) : null,
      basePrice: Number(c.basePrice) || 0,
      workingPrice: Number(c.workingPrice) || 0
    }));
}

function resolveBoundaryValues(
  readings: TimeRangeReading[],
  startDate: Date,
  endDate: Date,
  allReadings: TimeRangeReading[]
): { startValue: number | null; endValue: number | null } {
  let startValue: number | null = null;
  let endValue: number | null = null;

  if (allReadings.length >= 2) {
    startValue = interpolateValueAtDate(startDate, allReadings as unknown as { date: Date; value: number }[]);
    endValue = interpolateValueAtDate(endDate, allReadings as unknown as { date: Date; value: number }[]);
  }

  if (startValue === null && readings.length > 0) {
    startValue = readings[0].value;
  }
  if (endValue === null && readings.length > 0) {
    endValue = readings[readings.length - 1].value;
  }

  return { startValue, endValue };
}

/**
 * Calculate consumption for a meter within a time range
 */
export function calculateConsumptionInRange(
  readings: TimeRangeReading[],
  startDate: Date,
  endDate: Date,
  allReadings: TimeRangeReading[]
): number {
  if (readings.length === 0 && allReadings.length < 2) {
    return 0;
  }

  const { startValue, endValue } = resolveBoundaryValues(readings, startDate, endDate, allReadings);

  if (startValue === null || endValue === null) {
    // Range is entirely beyond all readings — extrapolate from daily average
    if (allReadings.length >= 2) {
      const dailyAvg = calculateDailyAverage(allReadings as unknown as { value: number; date: Date }[]);
      const daysInRange = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(0, dailyAvg * daysInRange);
    }
    return 0;
  }

  // Build ordered sequence: synthetic boundary values + actual readings in range
  const sequence = [
    { date: startDate, value: startValue },
    ...readings,
    { date: endDate, value: endValue },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return sumPositiveDeltas(sequence);
}

function sumPositiveDeltas(sequence: { date: Date; value: number }[]): number {
  let total = 0;
  for (let i = 1; i < sequence.length; i++) {
    const delta = sequence[i].value - sequence[i - 1].value;
    if (delta > 0) {
      total += delta;
    }
  }
  return total;
}

/**
 * Generate chart data with actual readings as points and interpolated line
 */
export function generateChartDataForMeter(
  meter: IMeter,
  allReadings: TimeRangeReading[],
  rangeReadings: TimeRangeReading[],
  startDate: Date,
  endDate: Date
): ChartDataset | null {
  if (allReadings.length < 2) {
    return null;
  }

  const meterColors: Record<string, string> = {
    power: '#9311fb',
    gas: '#f59e0b'
  };

  const borderColor = meterColors[meter.type] || '#9311fb';

  // Actual data points from readings in range
  const actualPoints: ChartDataPoint[] = rangeReadings.map(r => ({
    x: r.date.getTime(),
    y: r.value
  }));

  // Generate interpolated line with hourly points for smooth visualization
  const interpolatedLine: ChartDataPoint[] = [];
  if (allReadings.length >= 2) {
    const hourInMs = 60 * 60 * 1000;
    const msPerDay = 24 * 60 * 60 * 1000;
    let currentTime = startDate.getTime();
    const endTime = endDate.getTime();
    const lastReading = allReadings[allReadings.length - 1];
    const dailyAvg = calculateDailyAverage(allReadings as unknown as { value: number; date: Date }[]);

    while (currentTime <= endTime) {
      const currentDate = new Date(currentTime);
      let value = interpolateValueAtDate(currentDate, allReadings as unknown as { date: Date; value: number }[]);
      // Extrapolate beyond the last reading using the daily average rate
      if (value === null && currentDate > lastReading.date) {
        const daysSince = (currentTime - lastReading.date.getTime()) / msPerDay;
        value = lastReading.value + dailyAvg * daysSince;
      }
      if (value !== null) {
        interpolatedLine.push({ x: currentTime, y: value });
      }
      currentTime += hourInMs;
    }
  }

  return {
    label: meter.name,
    meterId: meter._id,
    meterType: meter.type,
    actualPoints,
    interpolatedLine,
    borderColor,
    unit: meter.unit
  };
}

/**
 * Calculate costs for all selected meters within a time range
 */
export function calculateTimeRangeCosts(
  meters: IMeter[],
  selectedMeterIds: Set<string>,
  readings: IReading[],
  contracts: IContract[],
  startDate: Date,
  endDate: Date
): TimeRangeCostResult {
  const meterBreakdowns: MeterCostBreakdown[] = [];
  let totalCost = 0;
  const allReadingsInRange = new Map<string, TimeRangeReading[]>();

  // Filter to only selected meters
  const metersToProcess = meters.filter(m => selectedMeterIds.has(m._id));

  for (const meter of metersToProcess) {
    const meterContracts = getMeterContracts(meter._id, contracts);
    const allMeterReadings = getAllMeterReadings(readings, meter._id);
    const rangeReadings = filterReadingsByDateRange(readings, meter._id, startDate, endDate);

    // Calculate consumption in the range
    const consumption = calculateConsumptionInRange(rangeReadings, startDate, endDate, allMeterReadings);

    // Calculate cost if we have consumption and contracts
    let cost = 0;
    if (consumption > 0 && meterContracts.length > 0) {
      cost = calculateIntervalCost(startDate, endDate, consumption, meterContracts);
    }

    // Add fixed costs even if no consumption (base fees)
    if (meterContracts.length > 0 && consumption === 0) {
      cost = calculateIntervalCost(startDate, endDate, 0, meterContracts);
    }

    meterBreakdowns.push({
      meterId: meter._id,
      meterName: meter.name,
      meterType: meter.type,
      unit: meter.unit,
      consumption,
      cost: Math.max(0, cost)
    });

    totalCost += Math.max(0, cost);
    allReadingsInRange.set(meter._id, allMeterReadings);
  }

  return {
    startDate,
    endDate,
    totalCost,
    meterBreakdowns,
    allReadingsInRange
  };
}

/**
 * Format a cost value as EUR currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.max(0, value));
}

/**
 * Format a date for display (DD.MM.YYYY)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}
