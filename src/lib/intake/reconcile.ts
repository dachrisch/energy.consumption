import { calculateCostForContract } from '../pricing';

export interface MeterLike {
  _id: string;
  meterNumber: string;
  unit?: string;
}

export interface ReadingLike {
  _id: string;
  date: Date | string;
  value: number;
}

export type ItemStatus = 'pending' | 'agrees' | 'conflict' | 'accepted' | 'rejected';

export interface ReadingCandidate {
  date: string;
  value: number;
  unit?: string;
  confidence?: number;
}

export interface ClassifiedReading {
  status: ItemStatus;
  matchedReadingId?: string;
  note?: string;
}

export const DEFAULT_DATE_WINDOW_DAYS = 5;
export const DEFAULT_VALUE_TOLERANCE = 1;

/**
 * Meter numbers are printed with dots, spaces and dashes; providers and users
 * disagree on all of them. Compare on alphanumerics only.
 */
export function normalizeMeterNumber(value: string | null | undefined): string {
  return (value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function withoutLeadingZeros(value: string): string {
  return value.replace(/^0+/, '');
}

export function findMeterByNumber<T extends MeterLike>(
  meters: T[],
  meterNumber: string | null | undefined,
): T | undefined {
  const wanted = normalizeMeterNumber(meterNumber);
  if (!wanted) {
    return undefined;
  }
  const exact = meters.find((m) => normalizeMeterNumber(m.meterNumber) === wanted);
  if (exact) {
    return exact;
  }
  const loose = withoutLeadingZeros(wanted);
  return meters.find((m) => {
    const candidate = withoutLeadingZeros(normalizeMeterNumber(m.meterNumber));
    return candidate === loose;
  });
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const first = new Date(a).getTime();
  const second = new Date(b).getTime();
  return Math.abs(first - second) / 86_400_000;
}

export function findNearbyReading(
  readings: ReadingLike[],
  date: string,
  windowDays = DEFAULT_DATE_WINDOW_DAYS,
): ReadingLike | undefined {
  let best: ReadingLike | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const reading of readings) {
    const distance = daysBetween(reading.date, date);
    if (distance <= windowDays && distance < bestDistance) {
      best = reading;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Decide what a provider reading means relative to what the user already has.
 * Agreement is auto-verified; disagreement is kept side by side, never
 * overwritten.
 */
export function classifyReading(
  candidate: ReadingCandidate,
  existingReadings: ReadingLike[],
  tolerance = DEFAULT_VALUE_TOLERANCE,
): ClassifiedReading {
  const nearby = findNearbyReading(existingReadings, candidate.date);
  if (!nearby) {
    return { status: 'pending' };
  }
  const delta = Math.abs(nearby.value - candidate.value);
  if (delta <= tolerance) {
    return {
      status: 'agrees',
      matchedReadingId: nearby._id,
      note: `Matches the existing reading from ${new Date(nearby.date).toISOString().slice(0, 10)}`,
    };
  }
  return {
    status: 'conflict',
    matchedReadingId: nearby._id,
    note: `Existing reading is ${nearby.value} (difference ${delta.toFixed(2)})`,
  };
}

export interface BillCandidate {
  periodStart?: string;
  periodEnd?: string;
  consumption?: number;
  amountGross?: number;
  amountNet?: number;
}

export interface Variance {
  absolute: number;
  percent: number | null;
}

/** Billed amount against what the contract rates would have produced. */
export function computeVariance(billed: number, expected: number): Variance {
  const absolute = billed - expected;
  return {
    absolute,
    percent: expected === 0 ? null : (absolute / expected) * 100,
  };
}

export function expectedCostForBill(
  contract: { basePrice: number; workingPrice: number; startDate: Date | string; endDate?: Date | string | null },
  consumption: number,
  days: number,
): number {
  return calculateCostForContract({
    consumption,
    days,
    contract: {
      basePrice: contract.basePrice,
      workingPrice: contract.workingPrice,
      startDate: new Date(contract.startDate),
      endDate: contract.endDate ? new Date(contract.endDate) : null,
    },
  });
}

export function periodDays(periodStart?: string, periodEnd?: string): number {
  if (!periodStart || !periodEnd) {
    return 0;
  }
  return daysBetween(periodStart, periodEnd);
}
