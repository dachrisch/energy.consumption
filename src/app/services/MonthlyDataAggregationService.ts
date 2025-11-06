/**
 * MonthlyDataAggregationService
 *
 * Service for calculating end-of-month meter readings with support for:
 * - Actual readings (within tolerance)
 * - Interpolation (between two readings)
 * - Extrapolation (using trend from two readings)
 *
 * Following SOLID principles:
 * - SRP: Each function has single responsibility
 * - OCP: Extensible via configuration
 * - DIP: No external dependencies
 */

import { EnergyType, EnergyOptions, MonthlyDataPoint, MonthlyConsumptionPoint } from '@/app/types';
import { endOfMonth, differenceInDays } from 'date-fns';

/**
 * Tolerance for considering a reading as "actual" month-end data
 * If reading is within this many days of month end, treat as actual
 */
const MONTH_END_TOLERANCE_DAYS = 3;

/**
 * Month labels for display
 */
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Get the last moment of a specific month
 *
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12, where 1 = January)
 * @returns Date representing last moment of the month
 */
export const getMonthEndDate = (year: number, month: number): Date => {
  // date-fns expects 0-indexed months
  return endOfMonth(new Date(year, month - 1, 1));
};

/**
 * Find the nearest energy reading to a target date within tolerance
 *
 * @param energyData - Array of energy readings (should be sorted by date)
 * @param targetDate - The date to search near
 * @param toleranceDays - Maximum days away from target (default: 3)
 * @returns The nearest reading or null if none within tolerance
 */
export const findNearestReading = (
  energyData: EnergyType[],
  targetDate: Date,
  toleranceDays: number = MONTH_END_TOLERANCE_DAYS
): EnergyType | null => {
  if (energyData.length === 0) return null;

  let nearest: EnergyType | null = null;
  let minDistance = Infinity;

  for (const reading of energyData) {
    const distance = Math.abs(differenceInDays(reading.date, targetDate));

    if (distance <= toleranceDays) {
      // If this is closer, or same distance but later timestamp, use it
      if (distance < minDistance) {
        minDistance = distance;
        nearest = reading;
      } else if (distance === minDistance && nearest) {
        // Same distance - pick the one with later timestamp (more accurate for end-of-day readings)
        if (reading.date.getTime() > nearest.date.getTime()) {
          nearest = reading;
        }
      }
    }
  }

  return nearest;
};

/**
 * Linearly interpolate a meter reading value for a target date
 * between two known readings
 *
 * @param prevReading - Reading before target date
 * @param nextReading - Reading after target date
 * @param targetDate - Date to interpolate for
 * @returns Interpolated meter reading value
 * @throws Error if prevReading is after nextReading or same date
 */
export const interpolateValue = (
  prevReading: EnergyType,
  nextReading: EnergyType,
  targetDate: Date
): number => {
  const prevTime = prevReading.date.getTime();
  const nextTime = nextReading.date.getTime();
  const targetTime = targetDate.getTime();

  // Validation
  if (prevTime > nextTime) {
    throw new Error('Invalid reading order: prev must be before next');
  }

  if (prevTime === nextTime) {
    throw new Error('Cannot interpolate between readings on same date');
  }

  // Calculate ratio (0 = at prev, 1 = at next)
  const ratio = (targetTime - prevTime) / (nextTime - prevTime);

  // Linear interpolation
  const interpolated = prevReading.amount + (nextReading.amount - prevReading.amount) * ratio;

  return interpolated;
};

/**
 * Extrapolate a meter reading value using trend from two known readings
 *
 * @param reading1 - First reading (earlier for forward extrapolation, later for backward)
 * @param reading2 - Second reading
 * @param targetDate - Date to extrapolate for
 * @returns Extrapolated meter reading value
 */
export const extrapolateValue = (
  reading1: EnergyType,
  reading2: EnergyType,
  targetDate: Date
): number => {
  const time1 = reading1.date.getTime();
  const time2 = reading2.date.getTime();
  const targetTime = targetDate.getTime();

  // Calculate rate of change (per millisecond)
  const timeDiff = time2 - time1;
  const amountDiff = reading2.amount - reading1.amount;

  if (timeDiff === 0) {
    return reading2.amount;
  }

  const rate = amountDiff / timeDiff;

  // Extrapolate from reading2
  const timeFromReading2 = targetTime - time2;
  const extrapolated = reading2.amount + (rate * timeFromReading2);

  return extrapolated;
};

/**
 * Calculate monthly meter readings for a specific year and energy type
 *
 * Algorithm:
 * 1. For each month, get the month-end date
 * 2. Check for actual reading within tolerance
 * 3. If no actual, try interpolation between neighbors
 * 4. If no neighbors on both sides, try extrapolation
 * 5. If not possible, return null
 *
 * @param energyData - Array of all energy readings
 * @param year - Target year (e.g., 2024)
 * @param type - Energy type ("power" or "gas")
 * @returns Array of 12 MonthlyDataPoint objects (one per month)
 */
export const calculateMonthlyReadings = (
  energyData: EnergyType[],
  year: number,
  type: EnergyOptions
): MonthlyDataPoint[] => {
  // Filter data by type and sort by date
  const filteredData = energyData
    .filter((reading) => reading.type === type)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const results: MonthlyDataPoint[] = [];

  // Process each month
  for (let month = 1; month <= 12; month++) {
    const monthEndDate = getMonthEndDate(year, month);

    // Try to find actual reading within tolerance
    const actualReading = findNearestReading(filteredData, monthEndDate, MONTH_END_TOLERANCE_DAYS);

    if (actualReading) {
      // Use actual reading
      results.push({
        month,
        monthLabel: MONTH_LABELS[month - 1],
        meterReading: actualReading.amount,
        isActual: true,
        isInterpolated: false,
        isExtrapolated: false,
        calculationDetails: {
          method: 'actual',
          sourceReadings: [{ date: actualReading.date, amount: actualReading.amount }],
        },
      });
      continue;
    }

    // Find readings before and after month end for interpolation
    const readingsBefore = filteredData.filter((r) => r.date.getTime() < monthEndDate.getTime());
    const readingsAfter = filteredData.filter((r) => r.date.getTime() > monthEndDate.getTime());

    const prevReading = readingsBefore.length > 0 ? readingsBefore[readingsBefore.length - 1] : null;
    const nextReading = readingsAfter.length > 0 ? readingsAfter[0] : null;

    // Try interpolation (needs both prev and next)
    if (prevReading && nextReading) {
      const interpolated = interpolateValue(prevReading, nextReading, monthEndDate);
      const prevTime = prevReading.date.getTime();
      const nextTime = nextReading.date.getTime();
      const targetTime = monthEndDate.getTime();
      const ratio = (targetTime - prevTime) / (nextTime - prevTime);

      results.push({
        month,
        monthLabel: MONTH_LABELS[month - 1],
        meterReading: interpolated,
        isActual: false,
        isInterpolated: true,
        isExtrapolated: false,
        calculationDetails: {
          method: 'interpolated',
          sourceReadings: [
            { date: prevReading.date, amount: prevReading.amount },
            { date: nextReading.date, amount: nextReading.amount },
          ],
          interpolationRatio: ratio,
        },
      });
      continue;
    }

    // Try extrapolation (needs two readings on one side)
    if (readingsBefore.length >= 2) {
      // Extrapolate forward
      const reading1 = readingsBefore[readingsBefore.length - 2];
      const reading2 = readingsBefore[readingsBefore.length - 1];
      const extrapolated = extrapolateValue(reading1, reading2, monthEndDate);

      results.push({
        month,
        monthLabel: MONTH_LABELS[month - 1],
        meterReading: extrapolated,
        isActual: false,
        isInterpolated: false,
        isExtrapolated: true,
        calculationDetails: {
          method: 'extrapolated',
          sourceReadings: [
            { date: reading1.date, amount: reading1.amount },
            { date: reading2.date, amount: reading2.amount },
          ],
        },
      });
      continue;
    }

    if (readingsAfter.length >= 2) {
      // Extrapolate backward
      const reading1 = readingsAfter[0];
      const reading2 = readingsAfter[1];
      const extrapolated = extrapolateValue(reading1, reading2, monthEndDate);

      results.push({
        month,
        monthLabel: MONTH_LABELS[month - 1],
        meterReading: extrapolated,
        isActual: false,
        isInterpolated: false,
        isExtrapolated: true,
        calculationDetails: {
          method: 'extrapolated',
          sourceReadings: [
            { date: reading1.date, amount: reading1.amount },
            { date: reading2.date, amount: reading2.amount },
          ],
        },
      });
      continue;
    }

    // No data available - return null
    results.push({
      month,
      monthLabel: MONTH_LABELS[month - 1],
      meterReading: null,
      isActual: false,
      isInterpolated: false,
      isExtrapolated: false,
      calculationDetails: {
        method: 'none',
      },
    });
  }

  return results;
};

/**
 * Determine if consumption value is from actual or derived data
 *
 * @param current - Current month's data point
 * @param previous - Previous month's data point
 * @returns Object with isActual and isDerived flags
 */
const determineConsumptionQuality = (
  current: MonthlyDataPoint,
  previous: MonthlyDataPoint
): { isActual: boolean; isDerived: boolean } => {
  const isActual = current.isActual && previous.isActual;
  const isDerived = !isActual;

  return { isActual, isDerived };
};

/**
 * Calculate monthly consumption from month-end meter readings
 *
 * Consumption for a month = Current month reading - Previous month reading
 * First month (January) will have null consumption unless previous December is provided
 *
 * @param monthlyData - Array of 12 MonthlyDataPoint objects (from calculateMonthlyReadings)
 * @param previousDecember - Optional: December reading from previous year for January calculation
 * @returns Array of 12 MonthlyConsumptionPoint objects
 *
 * @example
 * const readings = calculateMonthlyReadings(energyData, 2024, 'power');
 * const consumption = calculateMonthlyConsumption(readings);
 * // consumption[0].consumption === null (January, no previous data)
 * // consumption[1].consumption === readings[1].meterReading - readings[0].meterReading
 */
export const calculateMonthlyConsumption = (
  monthlyData: MonthlyDataPoint[],
  previousDecember?: MonthlyDataPoint
): MonthlyConsumptionPoint[] => {
  // Validation
  if (monthlyData.length !== 12) {
    throw new Error('monthlyData must contain exactly 12 months');
  }

  const results: MonthlyConsumptionPoint[] = [];

  for (let i = 0; i < 12; i++) {
    const current = monthlyData[i];
    const previous = i === 0 ? previousDecember || null : monthlyData[i - 1];

    // Calculate consumption
    let consumption: number | null = null;
    if (current.meterReading !== null && previous && previous.meterReading !== null) {
      consumption = current.meterReading - previous.meterReading;

      // Warn on negative consumption
      if (consumption < 0) {
        console.warn(
          `Negative consumption detected for ${current.monthLabel} (${current.month}): ${consumption}`
        );
      }
    }

    // Determine quality
    const quality = previous && consumption !== null
      ? determineConsumptionQuality(current, previous)
      : { isActual: false, isDerived: false };

    results.push({
      month: current.month,
      monthLabel: current.monthLabel,
      consumption,
      isActual: quality.isActual,
      isDerived: quality.isDerived,
      sourceReadings: {
        current,
        previous,
      },
    });
  }

  return results;
};
