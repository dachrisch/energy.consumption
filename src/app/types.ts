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

export type CostData = EnergyType & {
  cost: number;
  workingPrice: number;
  basePrice: number;
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
