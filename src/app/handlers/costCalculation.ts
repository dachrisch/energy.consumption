import { EnergyType, ContractType, EnergyOptions } from "../types";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

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
    const contractEnd = contract.endDate ? new Date(contract.endDate) : new Date(9999, 11, 31);

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
    const contractEnd = contract.endDate ? new Date(contract.endDate) : new Date(9999, 11, 31);

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
  console.log('[calculateConsumption] Input:', {
    readingsCount: readings.length,
    periodStart,
    periodEnd,
    readings: readings.map(r => ({ date: r.date, amount: r.amount, type: r.type }))
  });

  if (readings.length === 0) {
    console.log('[calculateConsumption] No readings, returning 0');
    return 0;
  }
  if (readings.length === 1) {
    console.log('[calculateConsumption] Single reading, returning 0');
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

  console.log('[calculateConsumption] Calculation:', {
    firstReading: { date: firstReading.date, amount: firstReading.amount },
    lastReading: { date: lastReading.date, amount: lastReading.amount },
    actualConsumption,
    readingsDuration: readingsDuration / (1000 * 60 * 60 * 24) + ' days',
    periodDuration: periodDuration / (1000 * 60 * 60 * 24) + ' days',
  });

  if (readingsDuration === 0) {
    // All readings on same day, can't extrapolate
    console.log('[calculateConsumption] Same day readings, returning actual:', actualConsumption);
    return actualConsumption;
  }

  // Calculate consumption rate (kWh per millisecond)
  const consumptionRate = actualConsumption / readingsDuration;

  // Extrapolate for full period
  const extrapolatedConsumption = consumptionRate * periodDuration;

  console.log('[calculateConsumption] Result:', {
    consumptionRate: consumptionRate * (1000 * 60 * 60 * 24) + ' kWh/day',
    extrapolatedConsumption
  });

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

    if (dataMap.has(currentPeriod)) {
      result.push(dataMap.get(currentPeriod)!);
    } else {
      // Interpolate: find nearest previous and next periods with data
      const previousData = result[result.length - 1];
      const nextData = sortedData.find(d => d.period > currentPeriod);

      const interpolatedCosts: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
      let totalCost = 0;

      energyTypes.forEach(type => {
        const prevCost = previousData?.costs[type] || 0;
        const nextCost = nextData?.costs[type] || prevCost;

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
        isInterpolated: true,
      });
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
 * Extrapolate future periods based on average of recent historical data
 */
const extrapolateFuture = (
  costData: CostData,
  period: CostPeriod,
  periodsToExtrapolate: number = 3,
  energyTypes: EnergyOptions[]
): CostData => {
  if (costData.length === 0) return [];

  const sortedData = [...costData].sort((a, b) =>
    a.periodStart.getTime() - b.periodStart.getTime()
  );

  // Calculate average costs from last 3 periods (or all if less than 3)
  const lookbackPeriods = Math.min(3, sortedData.length);
  const recentData = sortedData.slice(-lookbackPeriods);

  const averageCosts: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
  let averageTotal = 0;

  energyTypes.forEach(type => {
    const sum = recentData.reduce((acc, d) => acc + (d.costs[type] || 0), 0);
    const avg = sum / lookbackPeriods;
    averageCosts[type] = avg;
    averageTotal += avg;
  });

  const result = [...sortedData];
  let lastPeriod = sortedData[sortedData.length - 1].period;

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

    result.push({
      period: lastPeriod,
      periodStart: range.start,
      periodEnd: range.end,
      costs: averageCosts,
      totalCost: averageTotal,
      isExtrapolated: true,
    });
  }

  return result;
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

  console.log('[calculateCosts] Starting calculation:', {
    period,
    year,
    yearRange,
    energyDataCount: energyData.length,
    contractsCount: contracts.length,
    includeExtrapolation
  });

  if (energyData.length === 0 && !year && !yearRange) return [];

  const energyTypes: EnergyOptions[] = ["power", "gas"];
  const groupedData = groupByPeriod(energyData, period);

  console.log('[calculateCosts] Grouped data:', {
    periods: Array.from(groupedData.keys()),
    readingsPerPeriod: Array.from(groupedData.entries()).map(([period, readings]) => ({
      period,
      count: readings.length,
      types: readings.map(r => r.type)
    }))
  });

  const costData: CostData = [];

  // Calculate actual costs for periods with data
  groupedData.forEach((readings, periodKey) => {
    console.log(`[calculateCosts] Processing period: ${periodKey}`);
    const range = getPeriodRange(periodKey, period);
    const costs: Record<EnergyOptions, number> = {} as Record<EnergyOptions, number>;
    const breakdown: Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }> = {} as Record<EnergyOptions, { consumption: number; basePrice: number; workingPrice: number; totalCost: number }>;
    let totalCost = 0;

    energyTypes.forEach(type => {
      const typeReadings = readings.filter(r => r.type === type);
      console.log(`[calculateCosts] Period ${periodKey}, type ${type}: ${typeReadings.length} readings`);

      if (typeReadings.length > 0) {
        const consumption = calculateConsumption(typeReadings, range.start, range.end);

        // Find contract that overlaps with this period
        const contract = findContractForPeriod(range.start, range.end, type, contracts);
        console.log(`[calculateCosts] Period ${periodKey}, type ${type}: consumption=${consumption}, contract=${contract ? 'found' : 'not found'}`);

        if (contract && consumption > 0) {
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
            consumption: consumption || 0,
            basePrice: contract?.basePrice || 0,
            workingPrice: contract?.workingPrice || 0,
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
    for (let month = 1; month <= 12; month++) {
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
        // Create empty entry for missing year
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

  // Extrapolate future periods if requested (and not using yearRange which already handles this)
  if (includeExtrapolation && !yearRange) {
    return extrapolateFuture(interpolatedData, period, 3, energyTypes);
  }

  return interpolatedData;
};
