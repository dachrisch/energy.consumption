import { parseDateFlexible, formatDateToBrowserLocale, formatDateToIso } from '../dateUtils';

describe('dateUtils', () => {
  describe('parseDateFlexible', () => {
    it('should parse DD/MM/YYYY format', () => {
      const date = parseDateFlexible('15/01/2024');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should parse DD.MM.YYYY format', () => {
      const date = parseDateFlexible('15.01.2024');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should parse DD-MM-YYYY format', () => {
      const date = parseDateFlexible('15-01-2024');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should parse YYYY-MM-DD format', () => {
      const date = parseDateFlexible('2024-01-15');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should parse YYYY/MM/DD format', () => {
      const date = parseDateFlexible('2024/01/15');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should parse single digit days and months', () => {
      const date = parseDateFlexible('5/1/2024');
      expect(date.getDate()).toBe(5);
      expect(date.getMonth()).toBe(0);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should throw error for invalid date format', () => {
      expect(() => parseDateFlexible('invalid-date')).toThrow(
        'Unrecognized or unsupported date format: invalid-date'
      );
    });

    it('should throw error for invalid date values', () => {
      expect(() => parseDateFlexible('32/01/2024')).toThrow();
    });

    it('should throw error for invalid month', () => {
      expect(() => parseDateFlexible('15/13/2024')).toThrow();
    });

    it('should handle leap year correctly', () => {
      const date = parseDateFlexible('29/02/2024');
      expect(date.getDate()).toBe(29);
      expect(date.getMonth()).toBe(1);
    });

    it('should throw error for invalid leap year date', () => {
      expect(() => parseDateFlexible('29/02/2023')).toThrow();
    });

    it('should handle end of month dates', () => {
      const date = parseDateFlexible('31/12/2024');
      expect(date.getDate()).toBe(31);
      expect(date.getMonth()).toBe(11);
    });

    it('should throw error for 31st of month with 30 days', () => {
      expect(() => parseDateFlexible('31/04/2024')).toThrow();
    });

    it('should parse dates with leading zeros', () => {
      const date = parseDateFlexible('01/01/2024');
      expect(date.getDate()).toBe(1);
      expect(date.getMonth()).toBe(0);
    });

    it('should handle dates in different centuries', () => {
      const date = parseDateFlexible('01/01/1999');
      expect(date.getFullYear()).toBe(1999);
    });
  });

  describe('formatDateToBrowserLocale', () => {
    it('should format date to browser locale', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = formatDateToBrowserLocale(date);

      // The exact format depends on the browser locale, but it should contain the year, month, and day
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/01|1/);
      expect(formatted).toMatch(/15/);
    });

    it('should handle dates at year boundaries', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const formatted = formatDateToBrowserLocale(date);

      expect(formatted).toMatch(/2024/);
    });

    it('should handle dates at month boundaries', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      const formatted = formatDateToBrowserLocale(date);

      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/12/);
      expect(formatted).toMatch(/31/);
    });

    it('should format dates consistently', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 15);

      expect(formatDateToBrowserLocale(date1)).toBe(formatDateToBrowserLocale(date2));
    });
  });

  describe('formatDateToIso', () => {
    it('should format date to ISO format YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-01-15');
    });

    it('should pad single digit months with zero', () => {
      const date = new Date(2024, 0, 15); // January
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-01-15');
    });

    it('should pad single digit days with zero', () => {
      const date = new Date(2024, 0, 5); // 5th day
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-01-05');
    });

    it('should handle December correctly', () => {
      const date = new Date(2024, 11, 25); // December 25
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-12-25');
    });

    it('should handle first day of year', () => {
      const date = new Date(2024, 0, 1); // January 1
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-01-01');
    });

    it('should handle last day of year', () => {
      const date = new Date(2024, 11, 31); // December 31
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-12-31');
    });

    it('should handle leap year date', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('2024-02-29');
    });

    it('should handle dates in different centuries', () => {
      const date = new Date(1999, 11, 31);
      const formatted = formatDateToIso(date);

      expect(formatted).toBe('1999-12-31');
    });

    it('should format dates consistently', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 15);

      expect(formatDateToIso(date1)).toBe(formatDateToIso(date2));
    });

    it('should be reversible with parseDateFlexible', () => {
      const originalDate = new Date(2024, 0, 15);
      const formatted = formatDateToIso(originalDate);
      const parsed = parseDateFlexible(formatted);

      expect(parsed.getFullYear()).toBe(originalDate.getFullYear());
      expect(parsed.getMonth()).toBe(originalDate.getMonth());
      expect(parsed.getDate()).toBe(originalDate.getDate());
    });
  });
});
