import { describe, it, expect } from 'vitest';
import { parseLocaleNumber } from '../numberUtils';

describe('Number Utils', () => {
  it('parses European format (dot thousands, comma decimal)', () => {
    expect(parseLocaleNumber('3.000,00')).toBe(3000.00);
    expect(parseLocaleNumber('3.877,3')).toBe(3877.3);
  });

  it('parses US/UK format (comma thousands, dot decimal)', () => {
    expect(parseLocaleNumber('3,000.00')).toBe(3000.00);
    expect(parseLocaleNumber('2.852')).toBe(2.852);
  });

  it('parses simple numbers', () => {
    expect(parseLocaleNumber('1234')).toBe(1234);
    expect(parseLocaleNumber('1234.56')).toBe(1234.56);
    expect(parseLocaleNumber('1234,56')).toBe(1234.56);
  });

  it('handles whitespace', () => {
    expect(parseLocaleNumber(' 1 234,56 ')).toBe(1234.56);
  });

  it('returns NaN for empty or invalid input', () => {
    expect(parseLocaleNumber('')).toBeNaN();
    expect(parseLocaleNumber('abc')).toBeNaN();
  });
});
