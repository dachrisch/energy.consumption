export type EnergyOptions = "power" | "gas";

export type UserSpecific = {
  _id: string;
  userId: string;
};

export type Meter = UserSpecific & {
  name: string;
  meterNumber: string;
  type: EnergyOptions;
  unit: string;
};

export type Reading = UserSpecific & {
  meterId: string;
  value: number;
  date: Date | string;
};

export type ContractBase = {
  type: EnergyOptions;
  startDate: Date | string;
  endDate?: Date | string;
  basePrice: number;
  workingPrice: number;
  meterId?: string;
};

export type ContractType = UserSpecific & ContractBase;

export interface SimplifiedProjectionResult {
  meterId: string;
  totalConsumption: number;
  estimatedYearlyConsumption: number;
  estimatedYearlyCost: number;
  dailyAverage: number;
  daysTracked: number;
  hasContract: boolean;
}

export type ToastMessage = {
  message: string;
  type: "success" | "error" | "info";
};

export type Success = { success: boolean };
export type ApiResult = Success | { success: false; error: string };