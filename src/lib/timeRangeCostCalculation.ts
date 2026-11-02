import {
  calculateConsumptionBetween,
  calculateDailyAverage,
  type Reading,
} from './consumption';
import { buildDailyRateSeries, buildRateProjection } from './consumptionChartData';
import { calculateIntervalCost, Contract } from './pricing';
import { IMeter, IReading, IContract } from '../types/models';
import { formatCurrency as formatEuro, formatDate as formatDisplayDate } from './format';

export type TimeRangeReading = Reading;

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
  y: number | null; // consumption per day; null breaks the line
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
    .map(r => ({ date: new Date(r.date), value: r.value, kind: r.kind ?? 'regular' }))
    .filter(r => r.date >= startDate && r.date <= endDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get all readings for a meter (for interpolation purposes)
 */
function getAllMeterReadings(readings: IReading[], meterId: string): TimeRangeReading[] {
  return readings
    .filter(r => r.meterId === meterId)
    .map(r => ({ date: new Date(r.date), value: r.value, kind: r.kind ?? 'regular' }))
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

/**
 * Calculate consumption for a meter within a time range.
 */
export function calculateConsumptionInRange(
  readings: TimeRangeReading[],
  startDate: Date,
  endDate: Date,
  allReadings: TimeRangeReading[]
): number {
  if (allReadings.length < 2) {
    return 0;
  }

  const sorted = [...allReadings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const isOutsideReadings = endDate < sorted[0].date || startDate > sorted[sorted.length - 1].date;
  if (readings.length === 0 && isOutsideReadings) {
    const dailyAvg = calculateDailyAverage(allReadings);
    const daysInRange = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, dailyAvg * daysInRange);
  }

  return calculateConsumptionBetween(allReadings, startDate, endDate);
}

/**
 * Chart data for one meter: consumption per day between readings within the
 * range (gaps at meter changes and decreases), plus a dashed projection of the
 * current daily rate from the last reading to the end of the range.
 */
export function generateChartDataForMeter({
  meter,
  allReadings,
  startDate,
  endDate
}: {
  meter: IMeter;
  allReadings: TimeRangeReading[];
  rangeReadings?: TimeRangeReading[];
  startDate: Date;
  endDate: Date;
}): ChartDataset | null {
  if (allReadings.length < 2) {
    return null;
  }

  const meterColors: Record<string, string> = {
    power: '#9311fb',
    gas: '#f59e0b'
  };

  const interpolatedLine = buildRateProjection(allReadings, 0, endDate)
    .map(p => ({ ...p, x: Math.max(p.x, startDate.getTime()) }));

  return {
    label: meter.name,
    meterId: meter._id,
    meterType: meter.type,
    actualPoints: buildDailyRateSeries(allReadings, startDate, endDate),
    interpolatedLine,
    borderColor: meterColors[meter.type] || '#9311fb',
    unit: meter.unit
  };
}

/**
 * Calculate costs for all selected meters within a time range
 */
export function calculateTimeRangeCosts({
  meters,
  selectedMeterIds,
  readings,
  contracts,
  startDate,
  endDate
}: {
  meters: IMeter[];
  selectedMeterIds: Set<string>;
  readings: IReading[];
  contracts: IContract[];
  startDate: Date;
  endDate: Date;
}): TimeRangeCostResult {
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
  return formatEuro(Math.max(0, value));
}

/**
 * Format a date for display (DD.MM.YYYY)
 */
export function formatDate(date: Date): string {
  return formatDisplayDate(date);
}
