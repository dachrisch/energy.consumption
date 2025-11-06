/**
 * Tests for MonthlyDataAggregationService
 * Following TDD: Write tests first, then implement
 */

import {
  calculateMonthlyReadings,
  findNearestReading,
  interpolateValue,
  getMonthEndDate,
  extrapolateValue,
} from '../MonthlyDataAggregationService';
import { EnergyType } from '@/app/types';

describe('MonthlyDataAggregationService', () => {
  // Helper to create test readings
  const createReading = (date: Date, amount: number, type: 'power' | 'gas' = 'power'): EnergyType => ({
    _id: `${date.getTime()}`,
    type,
    amount,
    date,
    userId: 'test-user',
  });

  describe('getMonthEndDate', () => {
    it('should return last moment of standard 31-day month (January)', () => {
      const result = getMonthEndDate(2024, 1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January is 0-indexed
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });

    it('should return last moment of standard 30-day month (April)', () => {
      const result = getMonthEndDate(2024, 4);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(3); // April is 3 in 0-indexed
      expect(result.getDate()).toBe(30);
    });

    it('should handle leap year February (29 days)', () => {
      const result = getMonthEndDate(2024, 2);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February is 1 in 0-indexed
      expect(result.getDate()).toBe(29);
    });

    it('should handle non-leap year February (28 days)', () => {
      const result = getMonthEndDate(2025, 2);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(28);
    });

    it('should handle December (year boundary)', () => {
      const result = getMonthEndDate(2024, 12);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11); // December is 11 in 0-indexed
      expect(result.getDate()).toBe(31);
    });
  });

  describe('findNearestReading', () => {
    const testData: EnergyType[] = [
      createReading(new Date(2024, 0, 26), 1000),
      createReading(new Date(2024, 0, 29), 1010),
      createReading(new Date(2024, 0, 30), 1020),
      createReading(new Date(2024, 1, 3), 1030),
    ];

    it('should return exact match when reading exists on target date', () => {
      const targetDate = new Date(2024, 0, 30);
      const result = findNearestReading(testData, targetDate, 3);

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1020);
    });

    it('should return reading within tolerance (2 days before)', () => {
      const targetDate = new Date(2024, 0, 31);
      const result = findNearestReading(testData, targetDate, 3);

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1020); // Jan 30 is 1 day before Jan 31
    });

    it('should return reading within tolerance (3 days after)', () => {
      const targetDate = new Date(2024, 0, 31);
      const result = findNearestReading(testData, targetDate, 3);

      // Should find Jan 30 (1 day before) rather than Feb 3 (3 days after)
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1020);
    });

    it('should return null when reading is outside tolerance', () => {
      const targetDate = new Date(2024, 0, 31);
      const result = findNearestReading(testData, targetDate, 0); // 0 day tolerance

      // Jan 30 is 1 day away, outside 0-day tolerance
      expect(result).toBeNull();
    });

    it('should pick closest reading when multiple within tolerance', () => {
      const targetDate = new Date(2024, 0, 31);
      const result = findNearestReading(testData, targetDate, 5);

      // Jan 30 (1 day) is closer than Jan 29 (2 days) or Feb 3 (3 days)
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1020);
    });

    it('should return null for empty data array', () => {
      const result = findNearestReading([], new Date(2024, 0, 31), 3);
      expect(result).toBeNull();
    });

    it('should handle exactly at tolerance boundary (3 days)', () => {
      const targetDate = new Date(2024, 0, 31);
      const testDataBoundary = [createReading(new Date(2024, 0, 28), 1000)];
      const result = findNearestReading(testDataBoundary, targetDate, 3);

      // Jan 28 is exactly 3 days before Jan 31 - should be included (<=)
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1000);
    });
  });

  describe('interpolateValue', () => {
    it('should calculate midpoint interpolation correctly', () => {
      const prev = createReading(new Date(2024, 0, 1), 1000);
      const next = createReading(new Date(2024, 0, 31), 1100);
      const target = new Date(2024, 0, 16); // Midpoint

      const result = interpolateValue(prev, next, target);

      // Halfway between Jan 1 and Jan 31
      expect(result).toBeCloseTo(1050, 0);
    });

    it('should calculate quarter point interpolation', () => {
      const prev = createReading(new Date(2024, 0, 1), 1000);
      const next = createReading(new Date(2024, 0, 31), 1100);
      const target = new Date(2024, 0, 8); // ~25% through

      const result = interpolateValue(prev, next, target);

      // Should be around 1023-1025
      expect(result).toBeGreaterThan(1020);
      expect(result).toBeLessThan(1030);
    });

    it('should return previous value when target equals previous date', () => {
      const prev = createReading(new Date(2024, 0, 1), 1000);
      const next = createReading(new Date(2024, 0, 31), 1100);
      const target = new Date(2024, 0, 1);

      const result = interpolateValue(prev, next, target);

      expect(result).toBe(1000);
    });

    it('should return next value when target equals next date', () => {
      const prev = createReading(new Date(2024, 0, 1), 1000);
      const next = createReading(new Date(2024, 0, 31), 1100);
      const target = new Date(2024, 0, 31);

      const result = interpolateValue(prev, next, target);

      expect(result).toBe(1100);
    });

    it('should throw error when previous is after next', () => {
      const prev = createReading(new Date(2024, 0, 31), 1100);
      const next = createReading(new Date(2024, 0, 1), 1000);
      const target = new Date(2024, 0, 15);

      expect(() => interpolateValue(prev, next, target)).toThrow('Invalid reading order');
    });

    it('should throw error when prev and next are same date', () => {
      const prev = createReading(new Date(2024, 0, 15), 1000);
      const next = createReading(new Date(2024, 0, 15), 1100);
      const target = new Date(2024, 0, 15);

      expect(() => interpolateValue(prev, next, target)).toThrow('Cannot interpolate between readings on same date');
    });
  });

  describe('extrapolateValue', () => {
    it('should extrapolate forward from two previous readings', () => {
      const prev1 = createReading(new Date(2024, 0, 1), 1000);
      const prev2 = createReading(new Date(2024, 0, 31), 1100);
      const target = new Date(2024, 1, 29); // Feb 29

      const result = extrapolateValue(prev1, prev2, target);

      // Rate is 100 over 30 days = ~3.33/day
      // Feb 29 is 29 days after Jan 31
      // Expected: 1100 + (29 * 3.33) ≈ 1196
      expect(result).toBeGreaterThan(1180);
      expect(result).toBeLessThan(1210);
    });

    it('should extrapolate backward from two future readings', () => {
      const next1 = createReading(new Date(2024, 1, 29), 1200);
      const next2 = createReading(new Date(2024, 2, 31), 1300);
      const target = new Date(2024, 0, 31); // Jan 31

      const result = extrapolateValue(next1, next2, target);

      // Rate is 100 over ~31 days
      // Jan 31 is ~29 days before Feb 29
      // Expected: 1200 - (29 * ~3.23) ≈ 1106
      expect(result).toBeGreaterThan(1090);
      expect(result).toBeLessThan(1120);
    });

    it('should handle zero consumption rate', () => {
      const prev1 = createReading(new Date(2024, 0, 1), 1000);
      const prev2 = createReading(new Date(2024, 0, 31), 1000);
      const target = new Date(2024, 1, 29);

      const result = extrapolateValue(prev1, prev2, target);

      expect(result).toBe(1000);
    });
  });

  describe('calculateMonthlyReadings', () => {
    it('should use exact month-end reading as actual', () => {
      const data = [
        createReading(new Date(2024, 0, 31, 23, 59), 1000),
        createReading(new Date(2024, 1, 29, 23, 59), 1100),
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      expect(result).toHaveLength(12);
      expect(result[0].month).toBe(1);
      expect(result[0].meterReading).toBe(1000);
      expect(result[0].isActual).toBe(true);
      expect(result[0].isInterpolated).toBe(false);
      expect(result[0].isExtrapolated).toBe(false);

      expect(result[1].month).toBe(2);
      expect(result[1].meterReading).toBe(1100);
      expect(result[1].isActual).toBe(true);
    });

    it('should use reading within tolerance as actual', () => {
      const data = [
        createReading(new Date(2024, 0, 29), 1000), // 2 days before month end
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      expect(result[0].meterReading).toBe(1000);
      expect(result[0].isActual).toBe(true);
      expect(result[0].isInterpolated).toBe(false);
    });

    it('should interpolate when reading is outside tolerance', () => {
      const data = [
        createReading(new Date(2024, 0, 15), 1000),
        createReading(new Date(2024, 1, 15), 1100),
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      // January: should interpolate to end of January
      expect(result[0].month).toBe(1);
      expect(result[0].meterReading).toBeGreaterThan(1040);
      expect(result[0].meterReading).toBeLessThan(1060);
      expect(result[0].isActual).toBe(false);
      expect(result[0].isInterpolated).toBe(true);
      expect(result[0].isExtrapolated).toBe(false);
    });

    it('should return null for months with no data', () => {
      const data: EnergyType[] = [];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      expect(result).toHaveLength(12);
      result.forEach((month) => {
        expect(month.meterReading).toBeNull();
        expect(month.isActual).toBe(false);
        expect(month.isInterpolated).toBe(false);
        expect(month.isExtrapolated).toBe(false);
      });
    });

    it('should handle single reading in year', () => {
      const data = [
        createReading(new Date(2024, 5, 15), 1000),
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      // All months should be null (no neighbors to interpolate)
      result.forEach((month, index) => {
        if (index === 5) {
          // June might have the actual value if within tolerance, but June 15 is too far from June 30
          expect(month.meterReading).toBeNull();
        } else {
          expect(month.meterReading).toBeNull();
        }
      });
    });

    it('should handle multiple readings on month end (use latest)', () => {
      const data = [
        createReading(new Date(2024, 0, 31, 10, 0), 1000),
        createReading(new Date(2024, 0, 31, 23, 0), 1010),
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      expect(result[0].meterReading).toBe(1010); // Should use later reading
      expect(result[0].isActual).toBe(true);
    });

    it('should handle leap year February correctly', () => {
      const data = [
        createReading(new Date(2024, 1, 29), 1000),
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      expect(result[1].month).toBe(2);
      expect(result[1].meterReading).toBe(1000);
      expect(result[1].isActual).toBe(true);
    });

    it('should handle non-leap year February correctly', () => {
      const data = [
        createReading(new Date(2025, 1, 28), 1000),
      ];

      const result = calculateMonthlyReadings(data, 2025, 'power');

      expect(result[1].month).toBe(2);
      expect(result[1].meterReading).toBe(1000);
      expect(result[1].isActual).toBe(true);
    });

    it('should handle full year with all actual readings', () => {
      const data: EnergyType[] = Array.from({ length: 12 }, (_, i) => {
        const daysInMonth = new Date(2024, i + 1, 0).getDate();
        return createReading(new Date(2024, i, daysInMonth), 1000 + i * 100);
      });

      const result = calculateMonthlyReadings(data, 2024, 'power');

      expect(result).toHaveLength(12);
      result.forEach((month, index) => {
        expect(month.month).toBe(index + 1);
        expect(month.meterReading).toBe(1000 + index * 100);
        expect(month.isActual).toBe(true);
        expect(month.isInterpolated).toBe(false);
      });
    });

    it('should interpolate sparse data correctly', () => {
      const data = [
        createReading(new Date(2024, 0, 31), 1000), // Jan
        createReading(new Date(2024, 3, 30), 1300), // Apr
        createReading(new Date(2024, 6, 31), 1600), // Jul
        createReading(new Date(2024, 9, 31), 1900), // Oct
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      // January: actual
      expect(result[0].meterReading).toBe(1000);
      expect(result[0].isActual).toBe(true);

      // February: interpolated between Jan and Apr
      expect(result[1].meterReading).toBeGreaterThan(1050);
      expect(result[1].meterReading).toBeLessThan(1150);
      expect(result[1].isInterpolated).toBe(true);

      // April: actual
      expect(result[3].meterReading).toBe(1300);
      expect(result[3].isActual).toBe(true);

      // November and December: extrapolated
      expect(result[10].isExtrapolated).toBe(true);
      expect(result[11].isExtrapolated).toBe(true);
    });

    it('should filter by energy type', () => {
      const data = [
        createReading(new Date(2024, 0, 31), 1000, 'power'),
        createReading(new Date(2024, 0, 31), 500, 'gas'),
      ];

      const powerResult = calculateMonthlyReadings(data, 2024, 'power');
      const gasResult = calculateMonthlyReadings(data, 2024, 'gas');

      expect(powerResult[0].meterReading).toBe(1000);
      expect(gasResult[0].meterReading).toBe(500);
    });

    it('should include month labels', () => {
      const data: EnergyType[] = [];
      const result = calculateMonthlyReadings(data, 2024, 'power');

      const expectedLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      result.forEach((month, index) => {
        expect(month.monthLabel).toBe(expectedLabels[index]);
      });
    });

    it('should handle year with no matching energy type', () => {
      const data = [
        createReading(new Date(2024, 0, 31), 1000, 'power'),
      ];

      const result = calculateMonthlyReadings(data, 2024, 'gas');

      result.forEach((month) => {
        expect(month.meterReading).toBeNull();
      });
    });

    it('should extrapolate when only forward data exists', () => {
      const data = [
        createReading(new Date(2024, 6, 31), 1600), // Jul
        createReading(new Date(2024, 9, 31), 1900), // Oct
      ];

      const result = calculateMonthlyReadings(data, 2024, 'power');

      // January through June: extrapolate backward
      expect(result[0].isExtrapolated).toBe(true);
      expect(result[5].isExtrapolated).toBe(true);

      // July: actual
      expect(result[6].isActual).toBe(true);

      // August-September: interpolated
      expect(result[7].isInterpolated).toBe(true);

      // November-December: extrapolate forward
      expect(result[10].isExtrapolated).toBe(true);
    });
  });
});
