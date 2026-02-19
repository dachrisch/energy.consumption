import { describe, it, expect } from 'vitest';
import { parseDate } from '../dateUtils';

describe('parseDate', () => {
  it('parses DD.MM.YYYY (German format)', () => {
    expect(parseDate('01.01.2022')).toEqual(new Date('2022-01-01'));
    expect(parseDate('21.11.2022')).toEqual(new Date('2022-11-21'));
    expect(parseDate('23.11.2022')).toEqual(new Date('2022-11-23'));
    expect(parseDate('12.01.2023')).toEqual(new Date('2023-01-12'));
    expect(parseDate('15.09.2023')).toEqual(new Date('2023-09-15'));
    expect(parseDate('02.10.2024')).toEqual(new Date('2024-10-02'));
  });

  it('parses DD/MM/YYYY', () => {
    expect(parseDate('01/01/2022')).toEqual(new Date('2022-01-01'));
    expect(parseDate('15/09/2023')).toEqual(new Date('2023-09-15'));
  });

  it('parses ISO 8601 (YYYY-MM-DD)', () => {
    expect(parseDate('2022-01-01')).toEqual(new Date('2022-01-01'));
    expect(parseDate('2023-09-15')).toEqual(new Date('2023-09-15'));
  });

  it('returns Invalid Date for empty string', () => {
    expect(isNaN(parseDate('').getTime())).toBe(true);
  });

  it('returns Invalid Date for garbage input', () => {
    expect(isNaN(parseDate('not-a-date').getTime())).toBe(true);
  });

  it('handles single-digit day and month', () => {
    expect(parseDate('1.1.2022')).toEqual(new Date('2022-01-01'));
    expect(parseDate('5.3.2023')).toEqual(new Date('2023-03-05'));
  });
});
