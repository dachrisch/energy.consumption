export interface IMeter {
  _id: string;
  name: string;
  meterNumber: string;
  type: 'power' | 'gas';
  unit: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    dailyAverage: number;
    yearlyProjection: number;
    estimatedYearlyCost: number;
    dailyCost: number;
  };
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
  startDate: string | Date;
  endDate?: string | Date;
  basePrice: number;
  workingPrice: number;
  meterId: string;
  /** Provider mail settings, shared by every contract of the same provider. */
  senders?: string[];
  subjectHints?: string[];
  gmailQuery?: string | null;
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
  stats?: Record<string, unknown>;
}

/**
 * A provider is the `providerName` of a contract, not a collection of its own.
 * The API derives this view from the user's contracts.
 */
export interface IProvider {
  name: string;
  senders: string[];
  subjectHints: string[];
  gmailQuery: string | null;
  unit?: string;
  contractCount: number;
  meterIds: string[];
}

export type IntakeStatus = 'pending' | 'agrees' | 'conflict' | 'accepted' | 'rejected';

/** One extracted fact staged for the user to accept or reject. */
export interface IIntakeItem {
  _id: string;
  documentId: string;
  kind: 'reading' | 'bill';
  providerName?: string;
  meterNumber?: string;
  meterId?: string;
  date?: string;
  value?: number;
  unit?: string;
  periodStart?: string;
  periodEnd?: string;
  consumption?: number;
  amountGross?: number;
  amountNet?: number;
  currency?: string;
  matchedReadingId?: string;
  confidence?: number;
  status: IntakeStatus;
  note?: string;
  createdAt?: string;
}

export interface IProviderDocument {
  _id: string;
  providerName?: string;
  fileName: string;
  mimeType: string;
  status: 'new' | 'parsed' | 'needs_review' | 'imported' | 'failed';
  subject?: string;
  from?: string;
  receivedAt?: string;
  driveFileId?: string;
  driveWebLink?: string;
  error?: string;
}

/** A bill next to what the contract rates would have charged. */
export interface IBillComparison {
  _id: string;
  meterId: string;
  periodStart?: string;
  periodEnd?: string;
  consumption?: number;
  unit?: string;
  amountGross?: number;
  amountNet?: number;
  currency?: string;
  expected: number | null;
  variance: { absolute: number; percent: number | null } | null;
}
