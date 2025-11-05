/**
 * Tests for SliderCalculationService
 * Following TDD: Write tests first, then implement
 */

import {
  dateToPosition,
  positionToDate,
  clampPosition,
  calculateDateFromPosition,
  calculatePositionFromDate,
  isValidDateRange,
  normalizeDateRange,
} from '../SliderCalculationService';

describe('SliderCalculationService', () => {
  const startDate = new Date('2024-10-01');
  const endDate = new Date('2024-10-31');
  const containerWidth = 800; // pixels

  describe('dateToPosition', () => {
    it('should convert start date to position 0', () => {
      const result = dateToPosition(startDate, startDate, endDate, containerWidth);

      expect(result).toBe(0);
    });

    it('should convert end date to container width', () => {
      const result = dateToPosition(endDate, startDate, endDate, containerWidth);

      expect(result).toBe(containerWidth);
    });

    it('should convert middle date to middle position', () => {
      const middleDate = new Date('2024-10-16'); // Roughly middle of month
      const result = dateToPosition(middleDate, startDate, endDate, containerWidth);

      expect(result).toBeGreaterThan(containerWidth / 2 - 50);
      expect(result).toBeLessThan(containerWidth / 2 + 50);
    });

    it('should handle dates before range', () => {
      const beforeDate = new Date('2024-09-15');
      const result = dateToPosition(beforeDate, startDate, endDate, containerWidth);

      expect(result).toBeLessThan(0);
    });

    it('should handle dates after range', () => {
      const afterDate = new Date('2024-11-15');
      const result = dateToPosition(afterDate, startDate, endDate, containerWidth);

      expect(result).toBeGreaterThan(containerWidth);
    });

    it('should scale proportionally', () => {
      const quarterDate = new Date('2024-10-08'); // ~1/4 into month
      const result = dateToPosition(quarterDate, startDate, endDate, containerWidth);

      expect(result).toBeGreaterThan(containerWidth / 4 - 50);
      expect(result).toBeLessThan(containerWidth / 4 + 50);
    });
  });

  describe('positionToDate', () => {
    it('should convert position 0 to start date', () => {
      const result = positionToDate(0, startDate, endDate, containerWidth);

      expect(result.getTime()).toBe(startDate.getTime());
    });

    it('should convert container width to end date', () => {
      const result = positionToDate(containerWidth, startDate, endDate, containerWidth);

      expect(result.getTime()).toBe(endDate.getTime());
    });

    it('should convert middle position to middle date', () => {
      const result = positionToDate(containerWidth / 2, startDate, endDate, containerWidth);

      const expectedMiddle = new Date('2024-10-16');
      const diff = Math.abs(result.getTime() - expectedMiddle.getTime());
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000); // Within 1 day
    });

    it('should be inverse of dateToPosition', () => {
      const testDate = new Date('2024-10-15');
      const position = dateToPosition(testDate, startDate, endDate, containerWidth);
      const reconstructedDate = positionToDate(position, startDate, endDate, containerWidth);

      expect(reconstructedDate.getTime()).toBeCloseTo(testDate.getTime(), -3); // Within milliseconds
    });
  });

  describe('clampPosition', () => {
    it('should keep valid position unchanged', () => {
      const result = clampPosition(400, 0, 800);

      expect(result).toBe(400);
    });

    it('should clamp negative position to minimum', () => {
      const result = clampPosition(-50, 0, 800);

      expect(result).toBe(0);
    });

    it('should clamp excessive position to maximum', () => {
      const result = clampPosition(1000, 0, 800);

      expect(result).toBe(800);
    });

    it('should handle zero range', () => {
      const result = clampPosition(100, 0, 0);

      expect(result).toBe(0);
    });

    it('should handle edge values', () => {
      expect(clampPosition(0, 0, 800)).toBe(0);
      expect(clampPosition(800, 0, 800)).toBe(800);
    });
  });

  describe('calculateDateFromPosition', () => {
    it('should calculate date from position with clamping', () => {
      const result = calculateDateFromPosition(400, startDate, endDate, containerWidth);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it('should clamp position before calculating date', () => {
      const result = calculateDateFromPosition(-100, startDate, endDate, containerWidth);

      expect(result.getTime()).toBe(startDate.getTime());
    });

    it('should handle maximum position', () => {
      const result = calculateDateFromPosition(1000, startDate, endDate, containerWidth);

      expect(result.getTime()).toBe(endDate.getTime());
    });
  });

  describe('calculatePositionFromDate', () => {
    it('should calculate position from date with clamping', () => {
      const testDate = new Date('2024-10-15');
      const result = calculatePositionFromDate(testDate, startDate, endDate, containerWidth);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(containerWidth);
    });

    it('should clamp date before start', () => {
      const beforeDate = new Date('2024-09-15');
      const result = calculatePositionFromDate(beforeDate, startDate, endDate, containerWidth);

      expect(result).toBe(0);
    });

    it('should clamp date after end', () => {
      const afterDate = new Date('2024-11-15');
      const result = calculatePositionFromDate(afterDate, startDate, endDate, containerWidth);

      expect(result).toBe(containerWidth);
    });
  });

  describe('isValidDateRange', () => {
    it('should return true for valid range', () => {
      const result = isValidDateRange(startDate, endDate);

      expect(result).toBe(true);
    });

    it('should return false when start is after end', () => {
      const result = isValidDateRange(endDate, startDate);

      expect(result).toBe(false);
    });

    it('should return true when dates are equal', () => {
      const result = isValidDateRange(startDate, startDate);

      expect(result).toBe(true);
    });

    it('should handle null dates', () => {
      expect(isValidDateRange(null as unknown as Date, endDate)).toBe(false);
      expect(isValidDateRange(startDate, null as unknown as Date)).toBe(false);
      expect(isValidDateRange(null as unknown as Date, null as unknown as Date)).toBe(false);
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      expect(isValidDateRange(invalidDate, endDate)).toBe(false);
      expect(isValidDateRange(startDate, invalidDate)).toBe(false);
    });
  });

  describe('normalizeDateRange', () => {
    it('should keep valid range unchanged', () => {
      const result = normalizeDateRange(startDate, endDate);

      expect(result.start.getTime()).toBe(startDate.getTime());
      expect(result.end.getTime()).toBe(endDate.getTime());
    });

    it('should swap dates if start is after end', () => {
      const result = normalizeDateRange(endDate, startDate);

      expect(result.start.getTime()).toBe(startDate.getTime());
      expect(result.end.getTime()).toBe(endDate.getTime());
    });

    it('should handle same dates', () => {
      const result = normalizeDateRange(startDate, startDate);

      expect(result.start.getTime()).toBe(startDate.getTime());
      expect(result.end.getTime()).toBe(startDate.getTime());
    });
  });

  describe('performance', () => {
    it('should handle many calculations quickly', () => {
      const iterations = 1000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const date = new Date(startDate.getTime() + i * 1000000);
        const position = dateToPosition(date, startDate, endDate, containerWidth);
        positionToDate(position, startDate, endDate, containerWidth);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast (< 50ms for 1000 conversions)
    });
  });
});
