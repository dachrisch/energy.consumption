export type EnergyType = "power" | "gas";

export interface EnergyData {
  _id: string;
  date: string;
  type: EnergyType;
  amount: number;
}

export interface ImportResult {
  success: number;
  skipped: number;
  error: number;
}

export type SortField = 'date' | 'type' | 'amount';
export type SortOrder = 'asc' | 'desc'; 