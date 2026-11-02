import { describe, it, expect } from 'vitest';
import { countDaysInclusive, lastNDaysRange, parseFlexibleDate } from '../dateUtils';

describe('parseFlexibleDate', () => {
  it('parses DD.MM.YYYY (German format)', () => {
    expect(parseFlexibleDate('01.01.2022')).toEqual(new Date('2022-01-01'));
    expect(parseFlexibleDate('21.11.2022')).toEqual(new Date('2022-11-21'));
    expect(parseFlexibleDate('23.11.2022')).toEqual(new Date('2022-11-23'));
    expect(parseFlexibleDate('12.01.2023')).toEqual(new Date('2023-01-12'));
    expect(parseFlexibleDate('15.09.2023')).toEqual(new Date('2023-09-15'));
    expect(parseFlexibleDate('02.10.2024')).toEqual(new Date('2024-10-02'));
  });

  it('parses DD/MM/YYYY', () => {
    expect(parseFlexibleDate('01/01/2022')).toEqual(new Date('2022-01-01'));
    expect(parseFlexibleDate('15/09/2023')).toEqual(new Date('2023-09-15'));
  });

  it('parses ISO 8601 (YYYY-MM-DD)', () => {
    expect(parseFlexibleDate('2022-01-01')).toEqual(new Date('2022-01-01'));
    expect(parseFlexibleDate('2023-09-15')).toEqual(new Date('2023-09-15'));
  });

  it('returns null for empty string', () => {
    expect(parseFlexibleDate('')).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(parseFlexibleDate('not-a-date')).toBeNull();
  });

  it('handles single-digit day and month', () => {
    expect(parseFlexibleDate('1.1.2022')).toEqual(new Date('2022-01-01'));
    expect(parseFlexibleDate('5.3.2023')).toEqual(new Date('2023-03-05'));
  });

  it('handles US locale for ambiguous dates', () => {
    // 01/05/2022: EU -> May 1st, US -> Jan 5th
    expect(parseFlexibleDate('01/05/2022', 'EU')).toEqual(new Date('2022-05-01'));
    expect(parseFlexibleDate('01/05/2022', 'US')).toEqual(new Date('2022-01-05'));
  });
});

describe('date ranges', () => {
  it('counts 03.10.2026–02.11.2026 as 31 days across the October DST change', () => {
    expect(countDaysInclusive(new Date(2026, 9, 3, 0, 0), new Date(2026, 10, 2, 23, 59, 59))).toBe(31);
  });

  it.each([7, 30, 90, 365])('"Last %i days" spans exactly that many calendar days including today', (days) => {
    const today = new Date(2026, 10, 2, 15, 30); // 02.11.2026, after the DST change on 25.10.
    const { start, end } = lastNDaysRange(days, today);
    expect(countDaysInclusive(start, end)).toBe(days);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(2);
  });

  it('starts "Last 30 days" on 04.10.2026 when today is 02.11.2026', () => {
    const { start } = lastNDaysRange(30, new Date(2026, 10, 2));
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 9, 4]);
  });
});
