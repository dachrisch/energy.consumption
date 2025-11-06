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