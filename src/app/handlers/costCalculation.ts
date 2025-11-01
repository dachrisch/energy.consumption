import { EnergyType, ContractType, EnergyOptions } from "../types";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import {
  MAX_DATE_YEAR,
  MAX_DATE_MONTH,
  MAX_DATE_DAY,
  EXTRAPOLATION_PERIODS,
  LOOKBACK_PERIODS,
  MONTHS_PER_YEAR
} from "../constants/ui";

export type CostPeriod = "monthly" | "yearly";

export type CostDataPoint = {
  period: string; // "2024-01" for monthly, "2024" for yearly
  periodStart: Date;
  periodEnd: Date;
  costs: Record<EnergyOptions, number>;
  totalCost: number;
  breakdown?: Record<EnergyOptions, {
    consumption: number;
    basePrice: number;
    workingPrice: number;
    totalCost: number;
  }>;
  isInterpolated?: boolean; // True if this period's data was interpolated
  isExtrapolated?: boolean; // True if this period's data was extrapolated
};

export type CostData = CostDataPoint[];

/**
 * Get available years from energy data
 */
export const getAvailableYears = (energyData: EnergyType[]): number[] => {
  if (energyData.length === 0) return [];

  const years = new Set<number>();
  energyData.forEach((reading) => {
    const year = new Date(reading.date).getFullYear();
    years.add(year);
  });

  return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
};

/**
 * Find contracts that overlap with a given period
 * Returns the most applicable contract based on:
 * 1. Contract that covers the most time in the period
 * 2. If tie, the contract that starts first
 */
const findContractForPeriod = (
  periodStart: Date,
  periodEnd: Date,
  type: EnergyOptions,
  contracts: ContractType[]
): ContractType | null => {
  const applicableContracts = contracts.filter((contract) => {
    if (contract.type !== type) return false;

    const contractStart = new Date(contract.startDate);
    const contractEnd = contract.endDate ? new Date(contract.endDate) : new Date(MAX_DATE_YEAR, MAX_DATE_MONTH, MAX_DATE_DAY);

    // Check if contract overlaps with period
    // Contract overlaps if: contract_start <= period_end AND contract_end >= period_start
    return contractStart <= periodEnd && contractEnd >= periodStart;
  });

  if (applicableContracts.length === 0) return null;

  // If only one contract, return it
  if (applicableContracts.length === 1) return applicableContracts[0];

  // Calculate overlap duration for each contract and select the one with maximum overlap
  let maxOverlapContract = applicableContracts[0];
  let maxOverlapDuration = 0;

  applicableContracts.forEach((contract) => {
    const contractStart = new Date(contract.startDate);
    const contractEnd = contract.endDate ? new Date(contract.endDate) : new Date(MAX_DATE_YEAR, MAX_DATE_MONTH, MAX_DATE_DAY);

    // Calculate overlap
    const overlapStart = contractStart > periodStart ? contractStart : periodStart;
    const overlapEnd = contractEnd < periodEnd ? contractEnd : periodEnd;
    const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();

    if (overlapDuration > maxOverlapDuration) {
      maxOverlapDuration = overlapDuration;
      maxOverlapContract = contract;
    }
  });

  return maxOverlapContract;
};

/**
 * Calculate consumption for a period (difference between last and first reading)
 * For periods with partial data, extrapolates based on consumption rate
 */
const calculateConsumption = (
  readings: EnergyType[],
  periodStart: Date,
  periodEnd: Date
): number => {
  if (readings.length === 0) {
    return 0;
  }
  if (readings.length === 1) {
    return 0; // Can't calculate consumption with single reading
  }

  const sortedReadings = [...readings].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstReading = sortedReadings[0];
  const lastReading = sortedReadings[sortedReadings.length - 1];
  const actualConsumption = lastReading.amount - firstReading.amount;

  // Calculate the time span of actual readings
  const readingsStartTime = new Date(firstReading.date).getTime();
  const readingsEndTime = new Date(lastReading.date).getTime();
  const readingsDuration = readingsEndTime - readingsStartTime;

  // If readings don't span the entire period, extrapolate
  const periodDuration = periodEnd.getTime() - periodStart.getTime();

  if (readingsDuration === 0) {
    // All readings on same day, can't extrapolate
    return actualConsumption;
  }

  // Calculate consumption rate (kWh per millisecond)
  const consumptionRate = actualConsumption / readingsDuration;

  // Extrapolate for full period
  const extrapolatedConsumption = consumptionRate * periodDuration;

  return extrapolatedConsumption;
};

/**
 * Calculate cost for a given consumption and contract
 */
const calculateCost = (consumption: number, contract: ContractType): number => {
  return contract.basePrice + (consumption * contract.workingPrice);
};

/**
 * Group energy data by period (month or year)
 */
const groupByPeriod = (
  energyData: EnergyType[],
  period: CostPeriod
): Map<string, EnergyType[]> => {
  const grouped = new Map<string, EnergyType[]>();

  energyData.forEach((reading) => {
    const date = new Date(reading.date);
    const key = period === "monthly"
      ? format(date, "yyyy-MM")
      : format(date, "yyyy");

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(reading);
  });

  return grouped;
};

/**
 * Get date range for a period key
 */
const getPeriodRange = (periodKey: string, period: CostPeriod): { start: Date; end: Date } => {
  if (period === "monthly") {
    const [year, month] = periodKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  } else {
    const year = parseInt(periodKey);
    const date = new Date(year, 0, 1);
    return {
      start: startOfYear(date),
      end: endOfYear(date),
    };
  }
};

/**
 * Interpolate missing periods between earliest and latest data
 */
const fillMissingPeriods = (
  costData: CostData,
  period: CostPeriod,
  energyTypes: EnergyOptions[]
): CostData => {
  if (costData.length === 0) return [];

  const sortedData = [...costData].sort((a, b) =>
    a.periodStart.getTime() - b.periodStart.getTime()
  );

  const result: CostData = [];
  const dataMap = new Map<string, CostDataPoint>(
    sortedData.map(d => [d.period, d])
  );

  const firstPeriod = sortedData[0].period;
  const lastPeriod = sortedData[sortedData.length - 1].period;

  // Generate all periods between first and last
  let currentPeriod = firstPeriod;

  while (currentPeriod <= lastPeriod) {
    const range = getPeriodRange(currentPeriod, period);
    const existingData = dataMap.get(currentPeriod);

    // Use existing data only if it has actual values (totalCost > 0)
    // Otherwise interpolate even if the period exists
    if (existingData && existingData.totalCost > 0) {
      result.push(existingData);
    } else {
      // Interpolate: find nearest previous and next periods with data
      const previousData = result.find(d => d.totalCost > 0 && d.period < currentPeriod) ||
                          sortedData.slice().reverse().find(d => d.totalCost > 0 && d.period < currentPeriod);
      const nextData = sortedData.find(d => d.totalCost > 0 && d.period > currentPeriod);

      // Only interpolate if we have data on both sides
      if (previousData && nextData) {
        const interpolatedCosts: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
        let totalCost = 0;

        energyTypes.forEach(type => {
          const prevCost = previousData.costs[type] || 0;
          const nextCost = nextData.costs[type] || 0;

          // Simple linear interpolation
          const interpolatedCost = (prevCost + nextCost) / 2;
          interpolatedCosts[type] = interpolatedCost;
          totalCost += interpolatedCost;
        });

        result.push({
          period: currentPeriod,
          periodStart: range.start,
          periodEnd: range.end,
          costs: interpolatedCosts,
          totalCost,
          breakdown: existingData?.breakdown, // Preserve breakdown if it exists
          isInterpolated: true,
        });
      } else if (existingData) {
        // Keep the zero entry if we can't interpolate
        result.push(existingData);
      } else {
        // Create a zero entry as fallback
        result.push({
          period: currentPeriod,
          periodStart: range.start,
          periodEnd: range.end,
          costs: { power: 0, gas: 0 },
          totalCost: 0,
        });
      }
    }

    // Move to next period
    if (period === "monthly") {
      const [year, month] = currentPeriod.split("-").map(Number);
      const nextDate = new Date(year, month, 1); // month is already 1-indexed, so this goes to next month
      currentPeriod = format(nextDate, "yyyy-MM");
    } else {
      const year = parseInt(currentPeriod);
      currentPeriod = (year + 1).toString();
    }
  }

  return result;
};

/**
 * Calculate linear regression for a set of data points
 * Returns slope and intercept for y = mx + b
 */
const calculateLinearRegression = (data: { x: number; y: number }[]): { slope: number; intercept: number } => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: data[0].y };

  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

/**
 * Extrapolate future periods based on trendline (for yearly) or average (for monthly)
 * If fillExisting is true, it will fill existing periods with zero costs
 */
const extrapolateFuture = (
  costData: CostData,
  period: CostPeriod,
  periodsToExtrapolate: number = EXTRAPOLATION_PERIODS,
  energyTypes: EnergyOptions[],
  fillExisting: boolean = false
): CostData => {
  if (costData.length === 0) return [];

  const sortedData = [...costData].sort((a, b) =>
    a.periodStart.getTime() - b.periodStart.getTime()
  );

  const currentDate = new Date();

  // Find periods with actual data (totalCost > 0)
  const periodsWithData = sortedData.filter(d => d.totalCost > 0);

  if (periodsWithData.length === 0) return sortedData;

  // For yearly view with enough data, use linear regression trendline
  // For monthly or insufficient data, use simple averaging
  const useTrendline = period === "yearly" && periodsWithData.length >= 2;

  let averageCosts: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
  let averageTotal = 0;
  let averageBreakdown: Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }> = {} as Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }>;

  // Trendline slopes and intercepts for each energy type
  const trendlines: Record<EnergyOptions, { consumption: { slope: number; intercept: number }; cost: { slope: number; intercept: number } }> = {} as Record<EnergyOptions, { consumption: { slope: number; intercept: number }; cost: { slope: number; intercept: number } }>;

  if (useTrendline) {
    // Calculate trendlines for each energy type using data from last 2 years minimum
    energyTypes.forEach(type => {
      const dataPoints = periodsWithData.map((d, index) => ({
        x: index,
        yCost: d.costs[type] || 0,
        yConsumption: d.breakdown?.[type]?.consumption || 0,
      })).filter(d => d.yCost > 0 || d.yConsumption > 0);

      const costRegression = calculateLinearRegression(dataPoints.map(d => ({ x: d.x, y: d.yCost })));
      const consumptionRegression = calculateLinearRegression(dataPoints.map(d => ({ x: d.x, y: d.yConsumption })));

      trendlines[type] = {
        consumption: consumptionRegression,
        cost: costRegression,
      };
    });
  } else {
    // Calculate average costs from last 3 periods with data
    const lookbackPeriods = Math.min(LOOKBACK_PERIODS, periodsWithData.length);
    const recentData = periodsWithData.slice(-lookbackPeriods);

    energyTypes.forEach(type => {
      const sum = recentData.reduce((acc, d) => acc + (d.costs[type] || 0), 0);
      const avg = sum / lookbackPeriods;
      averageCosts[type] = avg;
      averageTotal += avg;
    });

    // Calculate average consumption for breakdown
    energyTypes.forEach(type => {
      const sumConsumption = recentData.reduce((acc, d) => acc + (d.breakdown?.[type]?.consumption || 0), 0);
      const avgConsumption = sumConsumption / lookbackPeriods;
      const sumBasePrice = recentData.reduce((acc, d) => acc + (d.breakdown?.[type]?.basePrice || 0), 0);
      const avgBasePrice = sumBasePrice / lookbackPeriods;
      const sumWorkingPrice = recentData.reduce((acc, d) => acc + (d.breakdown?.[type]?.workingPrice || 0), 0);
      const avgWorkingPrice = sumWorkingPrice / lookbackPeriods;

      averageBreakdown[type] = {
        consumption: avgConsumption,
        basePrice: avgBasePrice,
        workingPrice: avgWorkingPrice,
        totalCost: averageCosts[type],
      };
    });
  }

  const result = [...sortedData];

  if (fillExisting) {
    // Fill existing future periods with extrapolated data
    const lastDataPeriod = periodsWithData[periodsWithData.length - 1].periodStart;
    const lastDataIndex = periodsWithData.length - 1;

    result.forEach((dataPoint, index) => {
      if (dataPoint.periodStart > lastDataPeriod && dataPoint.totalCost === 0) {
        if (useTrendline) {
          // Calculate future index relative to data points
          const futureIndex = lastDataIndex + (index - result.indexOf(dataPoint));

          // Calculate extrapolated values using trendline
          const extrapolatedCosts: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
          const extrapolatedBreakdown: Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }> = {} as Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }>;
          let extrapolatedTotal = 0;

          energyTypes.forEach(type => {
            const costTrend = trendlines[type].cost;
            const consumptionTrend = trendlines[type].consumption;

            // Calculate values from trendline (ensure non-negative)
            const predictedCost = Math.max(0, costTrend.slope * futureIndex + costTrend.intercept);
            const predictedConsumption = Math.max(0, consumptionTrend.slope * futureIndex + consumptionTrend.intercept);

            extrapolatedCosts[type] = predictedCost;
            extrapolatedTotal += predictedCost;

            // Use average prices from recent data for breakdown
            const recentData = periodsWithData.slice(-3);
            const avgBasePrice = recentData.reduce((sum, d) => sum + (d.breakdown?.[type]?.basePrice || 0), 0) / recentData.length;
            const avgWorkingPrice = recentData.reduce((sum, d) => sum + (d.breakdown?.[type]?.workingPrice || 0), 0) / recentData.length;

            extrapolatedBreakdown[type] = {
              consumption: predictedConsumption,
              basePrice: avgBasePrice,
              workingPrice: avgWorkingPrice,
              totalCost: predictedCost,
            };
          });

          dataPoint.costs = extrapolatedCosts;
          dataPoint.totalCost = extrapolatedTotal;
          dataPoint.breakdown = extrapolatedBreakdown;
        } else {
          dataPoint.costs = { ...averageCosts };
          dataPoint.totalCost = averageTotal;
          dataPoint.breakdown = { ...averageBreakdown };
        }
        dataPoint.isExtrapolated = true;
      }
    });

    return result;
  }

  // Add new future periods
  let lastPeriod = sortedData[sortedData.length - 1].period;
  const lastDataIndex = periodsWithData.length - 1;

  for (let i = 0; i < periodsToExtrapolate; i++) {
    // Calculate next period
    if (period === "monthly") {
      const [year, month] = lastPeriod.split("-").map(Number);
      const nextDate = new Date(year, month, 1);
      lastPeriod = format(nextDate, "yyyy-MM");
    } else {
      const year = parseInt(lastPeriod);
      lastPeriod = (year + 1).toString();
    }

    const range = getPeriodRange(lastPeriod, period);

    let extrapolatedCosts: Record<EnergyOptions, number>;
    let extrapolatedTotal: number;
    let extrapolatedBreakdown: Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }>;

    if (useTrendline) {
      // Calculate future index
      const futureIndex = lastDataIndex + i + 1;

      extrapolatedCosts = {} as Record<EnergyOptions, number>;
      extrapolatedBreakdown = {} as Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }>;
      extrapolatedTotal = 0;

      energyTypes.forEach(type => {
        const costTrend = trendlines[type].cost;
        const consumptionTrend = trendlines[type].consumption;

        const predictedCost = Math.max(0, costTrend.slope * futureIndex + costTrend.intercept);
        const predictedConsumption = Math.max(0, consumptionTrend.slope * futureIndex + consumptionTrend.intercept);

        extrapolatedCosts[type] = predictedCost;
        extrapolatedTotal += predictedCost;

        const recentData = periodsWithData.slice(-3);
        const avgBasePrice = recentData.reduce((sum, d) => sum + (d.breakdown?.[type]?.basePrice || 0), 0) / recentData.length;
        const avgWorkingPrice = recentData.reduce((sum, d) => sum + (d.breakdown?.[type]?.workingPrice || 0), 0) / recentData.length;

        extrapolatedBreakdown[type] = {
          consumption: predictedConsumption,
          basePrice: avgBasePrice,
          workingPrice: avgWorkingPrice,
          totalCost: predictedCost,
        };
      });
    } else {
      extrapolatedCosts = { ...averageCosts };
      extrapolatedTotal = averageTotal;
      extrapolatedBreakdown = { ...averageBreakdown };
    }

    result.push({
      period: lastPeriod,
      periodStart: range.start,
      periodEnd: range.end,
      costs: extrapolatedCosts,
      totalCost: extrapolatedTotal,
      breakdown: extrapolatedBreakdown,
      isExtrapolated: true,
    });
  }

  return result;
};

/**
 * Calculate consumption between consecutive periods (for monthly/yearly views)
 * This calculates consumption as the difference between readings
 * - First tries to find readings in the exact periods
 * - Falls back to nearest readings if exact period readings are missing
 */
const calculateConsumptionBetweenPeriods = (
  allEnergyData: EnergyType[],
  currentPeriodKey: string,
  previousPeriodKey: string | null,
  type: EnergyOptions
): number => {
  // Get all readings for this type, sorted by date
  const sortedReadings = allEnergyData
    .filter(r => r.type === type)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedReadings.length < 2) {
    return 0;
  }

  // Parse period keys to date ranges
  const [currYear, currMonth] = currentPeriodKey.split("-").map(Number);
  const currentPeriodStart = new Date(currYear, currMonth - 1, 1);
  const currentPeriodEnd = new Date(currYear, currMonth, 0, 23, 59, 59);

  let previousPeriodStart: Date | null = null;
  let previousPeriodEnd: Date | null = null;
  if (previousPeriodKey) {
    const [prevYear, prevMonth] = previousPeriodKey.split("-").map(Number);
    previousPeriodStart = new Date(prevYear, prevMonth - 1, 1);
    previousPeriodEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59);
  }

  // Find reading in current period, or the next available reading after previous period
  let currentReading = sortedReadings.find(r => {
    const readingDate = new Date(r.date);
    return readingDate >= currentPeriodStart && readingDate <= currentPeriodEnd;
  });

  // If no reading in current period, find the next reading after previous period end
  if (!currentReading && previousPeriodEnd) {
    currentReading = sortedReadings.find(r => {
      const readingDate = new Date(r.date);
      return readingDate > previousPeriodEnd;
    });
  }

  // Find reading in previous period, or the most recent reading before current period
  let previousReading: EnergyType | undefined = undefined;
  if (previousPeriodStart && previousPeriodEnd) {
    previousReading = sortedReadings.find(r => {
      const readingDate = new Date(r.date);
      return readingDate >= previousPeriodStart && readingDate <= previousPeriodEnd;
    });

    // If no reading in previous period, find the most recent reading before current period
    if (!previousReading) {
      previousReading = sortedReadings.slice().reverse().find(r => {
        const readingDate = new Date(r.date);
        return readingDate < currentPeriodStart;
      });
    }
  }

  if (!currentReading || !previousReading) {
    return 0;
  }

  // Don't calculate if they're the same reading
  if (currentReading === previousReading) {
    return 0;
  }

  const consumption = currentReading.amount - previousReading.amount;
  return consumption;
};

/**
 * Calculate costs for all periods with interpolation and extrapolation
 */
export const calculateCosts = (
  energyData: EnergyType[],
  contracts: ContractType[],
  period: CostPeriod,
  options: {
    includeExtrapolation?: boolean;
    year?: number; // For monthly view: show all months of this year
    yearRange?: { past: number; future: number }; // For yearly view
  } = {}
): CostData => {
  const { includeExtrapolation = true, year, yearRange } = options;

  if (energyData.length === 0 && !year && !yearRange) return [];

  const energyTypes: EnergyOptions[] = ["power", "gas"];
  const groupedData = groupByPeriod(energyData, period);

  const costData: CostData = [];
  const sortedPeriodKeys = Array.from(groupedData.keys()).sort();

  // Calculate actual costs for periods with data
  sortedPeriodKeys.forEach((periodKey, index) => {
    const previousPeriodKey = index > 0 ? sortedPeriodKeys[index - 1] : null;

    const range = getPeriodRange(periodKey, period);
    const costs: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
    const breakdown: Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }> = {} as Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }>;
    let totalCost = 0;

    energyTypes.forEach(type => {
      // For monthly periods, calculate consumption as difference between consecutive readings
      const consumption = period === 'monthly'
        ? calculateConsumptionBetweenPeriods(energyData, periodKey, previousPeriodKey, type)
        : calculateConsumption(groupedData.get(periodKey)?.filter(r => r.type === type) || [], range.start, range.end);

      if (consumption > 0) {
        // Find contract that overlaps with this period
        const contract = findContractForPeriod(range.start, range.end, type, contracts);

        if (contract) {
          const cost = calculateCost(consumption, contract);
          costs[type] = cost;
          totalCost += cost;

          breakdown[type] = {
            consumption,
            basePrice: contract.basePrice,
            workingPrice: contract.workingPrice,
            totalCost: cost,
          };
        } else {
          costs[type] = 0;
          breakdown[type] = {
            consumption,
            basePrice: 0,
            workingPrice: 0,
            totalCost: 0,
          };
        }
      } else {
        costs[type] = 0;
        breakdown[type] = {
          consumption: 0,
          basePrice: 0,
          workingPrice: 0,
          totalCost: 0,
        };
      }
    });

    costData.push({
      period: periodKey,
      periodStart: range.start,
      periodEnd: range.end,
      costs,
      totalCost,
      breakdown,
    });
  });

  // Sort by period
  let sortedCostData = costData.sort((a, b) =>
    a.periodStart.getTime() - b.periodStart.getTime()
  );

  // For monthly view with specified year: ensure all 12 months are present
  if (period === "monthly" && year) {
    const allMonths: CostData = [];
    for (let month = 1; month <= MONTHS_PER_YEAR; month++) {
      const periodKey = `${year}-${String(month).padStart(2, "0")}`;
      const existing = sortedCostData.find(d => d.period === periodKey);

      if (existing) {
        allMonths.push(existing);
      } else {
        // Create empty entry for missing month
        const range = getPeriodRange(periodKey, period);
        allMonths.push({
          period: periodKey,
          periodStart: range.start,
          periodEnd: range.end,
          costs: { power: 0, gas: 0 },
          totalCost: 0,
          breakdown: {
            power: { consumption: 0, basePrice: 0, workingPrice: 0, totalCost: 0 },
            gas: { consumption: 0, basePrice: 0, workingPrice: 0, totalCost: 0 },
          },
        });
      }
    }
    sortedCostData = allMonths;
  }

  // For yearly view with specified range: ensure all years are present
  if (period === "yearly" && yearRange) {
    const currentYear = new Date().getFullYear();
    const startYear = energyData.length > 0
      ? new Date(Math.min(...energyData.map(d => new Date(d.date).getTime()))).getFullYear() - yearRange.past
      : currentYear - yearRange.past;
    const endYear = currentYear + yearRange.future;

    const allYears: CostData = [];
    for (let yr = startYear; yr <= endYear; yr++) {
      const periodKey = yr.toString();
      const existing = sortedCostData.find(d => d.period === periodKey);

      if (existing) {
        allYears.push(existing);
      } else {
        // Create empty entry for missing year (will be filled by interpolation/extrapolation)
        const range = getPeriodRange(periodKey, period);
        allYears.push({
          period: periodKey,
          periodStart: range.start,
          periodEnd: range.end,
          costs: { power: 0, gas: 0 },
          totalCost: 0,
          breakdown: {
            power: { consumption: 0, basePrice: 0, workingPrice: 0, totalCost: 0 },
            gas: { consumption: 0, basePrice: 0, workingPrice: 0, totalCost: 0 },
          },
        });
      }
    }
    sortedCostData = allYears;
  }

  // Interpolate missing periods (only for ranges with actual data)
  const interpolatedData = fillMissingPeriods(sortedCostData, period, energyTypes);

  // Extrapolate future periods if requested
  if (includeExtrapolation) {
    // If year or yearRange is specified, fill existing future periods instead of adding new ones
    const fillExisting = !!(year || yearRange);
    return extrapolateFuture(interpolatedData, period, EXTRAPOLATION_PERIODS, energyTypes, fillExisting);
  }

  return interpolatedData;
};
