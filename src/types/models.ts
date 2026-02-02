export interface IMeter {
  _id: string;
  name: string;
  meterNumber: string;
  type: 'power' | 'gas';
  unit: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IReading {
  _id: string;
  meterId: string;
  value: number;
  date: string | Date;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IContract {
  _id: string;
  providerName: string;
  type: 'power' | 'gas';
  startDate: string | Date;
  endDate?: string | Date;
  basePrice: number;
  workingPrice: number;
  meterId: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  googleApiKey?: string;
  createdAt?: string;
  updatedAt?: string;
}
