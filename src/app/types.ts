import { Time } from "@/lib/pond/time";
import { TimeSeries } from "@/lib/pond/timeseries";

export type EnergyOptions = "power" | "gas";

export type UserSpecific = {
  _id: string;
  userId: string;
};
export type EnergyType = UserSpecific & EnergyBase;

export type EnergyBase = {
  date: Date;
  type: EnergyOptions;
  amount: number;
};

export type ImportResult = {
  success: number;
  skipped: number;
  error: number;
};

export type ContractsSortField =
  | "type"
  | "startDate"
  | "endDate"
  | "basePrice"
  | "workingPrice";
export type EnergySortField = "type" | "date" | "amount";
export type SortOrder = "asc" | "desc";

export type NewUserType = {
  name: string;
  email: string;
  password: string;
};

export type ContractBase = {
  type: EnergyOptions;
  startDate: Date;
  endDate?: Date;
  basePrice: number;
  workingPrice: number;
};

export type ContractType = UserSpecific & ContractBase;

export type Success = { success: boolean };
export type ApiResult = Success | Error;

export type ToastMessage = {
  message: string;
  type: "success" | "error" | "info";
};

export type EnergyData = EnergyType[];
export type EnergyTimeSeries = Record<EnergyOptions, TimeSeries<Time>>;

/**
 * Data point representing meter reading for a specific month
 */
export type MonthlyDataPoint = {
  month: number; // 1-12 (January = 1)
  monthLabel: string; // "Jan", "Feb", ..., "Dec"
  meterReading: number | null; // Meter reading in kWh, null if no data
  isActual: boolean; // true if value comes from actual measurement
  isInterpolated: boolean; // true if value was calculated via interpolation
  isExtrapolated: boolean; // true if value was calculated via extrapolation
  calculationDetails?: {
    method: 'actual' | 'interpolated' | 'extrapolated' | 'none';
    sourceReadings?: Array<{
      date: Date;
      amount: number;
    }>;
    interpolationRatio?: number; // For debugging interpolation
  };
};

/**
 * Data point representing monthly consumption (difference between meter readings)
 */
export type MonthlyConsumptionPoint = {
  month: number; // 1-12 (January = 1)
  monthLabel: string; // "Jan", "Feb", ..., "Dec"
  consumption: number | null; // kWh or m³ consumed in this month
  isActual: boolean; // true if both current and previous readings are actual
  isDerived: boolean; // true if one or both readings are interpolated/extrapolated
  sourceReadings: {
    current: MonthlyDataPoint; // Current month's meter reading
    previous: MonthlyDataPoint | null; // Previous month's meter reading (null for January)
    next?: MonthlyDataPoint; // Next month's meter reading (used for December fallback)
  };
};

// ============================================================================
// Repository Pattern Types (Phase 1: Backend Foundation)
// ============================================================================

/**
 * Source energy reading - single source of truth for energy data
 * Raw meter readings stored directly from user input or CSV import
 */
export type SourceEnergyReading = UserSpecific & {
  type: EnergyOptions;
  amount: number;
  unit: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Display data types - pre-calculated data for different UI views
 * Allows for efficient caching and invalidation of computed data
 */
export type DisplayDataType =
  | "monthly-chart-power"
  | "monthly-chart-gas"
  | "histogram-power"
  | "histogram-gas"
  | "table-data";

/**
 * Display energy data - pre-calculated, cached data for UI consumption
 * Calculated on-demand and cached to avoid repeated expensive calculations
 */
export type DisplayEnergyData = UserSpecific & {
  displayType: DisplayDataType;
  data: unknown; // Specific structure depends on displayType (monthly data, histogram, etc.)
  calculatedAt: Date;
  sourceDataHash: string; // Hash of source data used for calculation
  metadata?: {
    sourceReadingCount: number;
    calculationTimeMs: number;
    filters?: Record<string, unknown>;
  };
};

/**
 * Energy filters for querying source readings
 * Used by repository layer to filter and paginate data
 */
export type EnergyFilters = {
  type?: EnergyOptions | EnergyOptions[];
  dateRange?: { start: Date; end: Date };
  limit?: number;
  offset?: number;
  sortBy?: "date" | "amount" | "type";
  sortOrder?: "asc" | "desc";
};