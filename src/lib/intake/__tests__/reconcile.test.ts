import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DATE_WINDOW_DAYS,
  classifyReading,
  computeVariance,
  daysBetween,
  expectedCostForBill,
  findMeterByNumber,
  findNearbyReading,
  normalizeMeterNumber,
  periodDays,
} from '../reconcile';

const meters = [
  { _id: 'm1', meterNumber: '1-234-567', unit: 'kWh' },
  { _id: 'm2', meterNumber: '000987', unit: 'kWh' },
];

const readings = [
  { _id: 'r1', date: new Date('2024-01-01T00:00:00Z'), value: 1000 },
  { _id: 'r2', date: new Date('2024-02-01T00:00:00Z'), value: 2000 },
];

describe('normalizeMeterNumber', () => {
  it('keeps only alphanumerics, upper-cased', () => {
    expect(normalizeMeterNumber('1 234-567/ab')).toBe('1234567AB');
    expect(normalizeMeterNumber(null)).toBe('');
    expect(normalizeMeterNumber(undefined)).toBe('');
  });
});

describe('findMeterByNumber', () => {
  it('matches despite dots, spaces and casing', () => {
    expect(findMeterByNumber(meters, '1234 567')?._id).toBe('m1');
    expect(findMeterByNumber(meters, '1.234.567')?._id).toBe('m1');
  });

  it('tolerates leading zeros', () => {
    expect(findMeterByNumber(meters, '987')?._id).toBe('m2');
    expect(findMeterByNumber(meters, '0000987')?._id).toBe('m2');
  });

  it('matches when the stored meter carries a provider prefix', () => {
    const prefixed = [{ _id: 'm3', meterNumber: 'SWM 600044', unit: 'm³' }];
    expect(findMeterByNumber(prefixed, '600044')?._id).toBe('m3');
    expect(findMeterByNumber(prefixed, '600 044')?._id).toBe('m3');
    expect(findMeterByNumber(meters, '600044')).toBeUndefined();
  });

  it('does not match on short digit fragments', () => {
    const prefixed = [{ _id: 'm3', meterNumber: 'SWM 600044', unit: 'm³' }];
    expect(findMeterByNumber(prefixed, '044')).toBeUndefined();
  });

  it('returns undefined for unknown or empty numbers', () => {
    expect(findMeterByNumber(meters, '999')).toBeUndefined();
    expect(findMeterByNumber(meters, '')).toBeUndefined();
    expect(findMeterByNumber(meters, null)).toBeUndefined();
  });
});

describe('daysBetween', () => {
  it('is absolute and accepts strings', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30);
    expect(daysBetween('2024-01-31', '2024-01-01')).toBe(30);
    expect(daysBetween(new Date('2024-01-01T00:00:00Z'), new Date('2024-01-02T12:00:00Z'))).toBe(1.5);
  });
});

describe('findNearbyReading', () => {
  it('picks the closest reading inside the window', () => {
    expect(findNearbyReading(readings, '2024-01-03')?._id).toBe('r1');
    expect(findNearbyReading(readings, '2024-01-30')?._id).toBe('r2');
  });

  it('returns undefined outside the window', () => {
    expect(findNearbyReading(readings, '2024-03-15')).toBeUndefined();
    expect(findNearbyReading([], '2024-01-01')).toBeUndefined();
  });

  it('honours a custom window', () => {
    expect(findNearbyReading(readings, '2024-01-03', 1)).toBeUndefined();
    expect(DEFAULT_DATE_WINDOW_DAYS).toBe(5);
  });
});

describe('classifyReading', () => {
  it('is pending when there is nothing to compare against', () => {
    expect(classifyReading({ date: '2024-05-01', value: 10 }, readings)).toEqual({ status: 'pending' });
  });

  it('agrees within the tolerance and links the existing reading', () => {
    const result = classifyReading({ date: '2024-01-02', value: 1000.8 }, readings);

    expect(result.status).toBe('agrees');
    expect(result.matchedReadingId).toBe('r1');
    expect(result.note).toContain('2024-01-01');
  });

  it('reports a conflict and keeps both values visible', () => {
    const result = classifyReading({ date: '2024-01-02', value: 1099.2 }, readings);

    expect(result.status).toBe('conflict');
    expect(result.matchedReadingId).toBe('r1');
    expect(result.note).toContain('1000');
    expect(result.note).toContain('99.20');
  });
});

describe('computeVariance', () => {
  it('returns the absolute and relative difference', () => {
    expect(computeVariance(120, 100)).toEqual({ absolute: 20, percent: 20 });
    expect(computeVariance(80, 100)).toEqual({ absolute: -20, percent: -20 });
  });

  it('cannot express a percentage against zero', () => {
    expect(computeVariance(50, 0)).toEqual({ absolute: 50, percent: null });
  });
});

describe('expectedCostForBill', () => {
  it('applies base price per month plus working price per unit', () => {
    const contract = {
      basePrice: 12,
      workingPrice: 0.3,
      startDate: new Date('2024-01-01'),
      endDate: null,
    };

    // 30.44 days == one month of base price
    expect(expectedCostForBill(contract, 100, 30.44)).toBeCloseTo(42, 5);
  });

  it('accepts string dates', () => {
    const contract = { basePrice: 0, workingPrice: 0.5, startDate: '2024-01-01', endDate: '2024-12-31' };
    expect(expectedCostForBill(contract, 10, 10)).toBeCloseTo(5, 5);
  });
});

describe('periodDays', () => {
  it('returns whole days for a complete period', () => {
    expect(periodDays('2024-01-01', '2024-03-31')).toBe(90);
  });

  it('returns 0 for incomplete periods', () => {
    expect(periodDays(undefined, '2024-03-31')).toBe(0);
    expect(periodDays('2024-01-01', undefined)).toBe(0);
  });
});
