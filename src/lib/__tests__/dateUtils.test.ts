import { describe, it, expect } from 'vitest';
import { parseFlexibleDate } from '../dateUtils';

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
