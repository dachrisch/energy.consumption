export type EnergyType = "power" | "gas";

export type UserSpecific = {
  _id: string;
  userId: string;
};
export type EnergyDataType = UserSpecific & EnergyDataBase;

export type EnergyDataBase = {
  date: Date;
  type: EnergyType;
  amount: number;
};


export type ImportResult = {
  success: number;
  skipped: number;
  error: number;
};

export type SortFieldContracts = "type" | "startDate" | "endDate" | "basePrice" | "workingPrice";
export type SortFieldEnergy = "type" | "date" | "amount";
export type SortOrder = "asc" | "desc";

export type NewUserType = {
  name: string;
  email: string;
  password: string;
};

export type EnergyContractBase = {
  type: EnergyType;
  startDate: Date;
  endDate?: Date;
  basePrice: number;
  workingPrice: number;
};

export type EnergyContractType = UserSpecific & EnergyContractBase;


export type ApiResult = { success: boolean } | Error;
