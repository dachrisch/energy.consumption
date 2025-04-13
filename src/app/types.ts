export type EnergyType = "power" | "gas";

export type EnergyDataType = {
  _id: string;
  date: Date;
  type: EnergyType;
  amount: number;
  userId: string;
};

export type NewEnergyDataType = Omit<EnergyDataType, "_id" | "userId">;

export type ImportResult = {
  success: number;
  skipped: number;
  error: number;
};

export type SortField = "date" | "type" | "amount";
export type SortOrder = "asc" | "desc";

export type NewUserType = {
  name: string;
  email: string;
  password: string;
};
