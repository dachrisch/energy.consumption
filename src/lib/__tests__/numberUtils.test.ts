import { describe, it, expect } from 'vitest';
import { parseLocaleNumber, detectLocale } from '../numberUtils';

describe('Number Utils', () => {
  it('parses European format (dot thousands, comma decimal)', () => {
    expect(parseLocaleNumber('3.000,00', 'EU')).toBe(3000.00);
    expect(parseLocaleNumber('3.877,3', 'EU')).toBe(3877.3);
  });

  it('parses US/UK format (comma thousands, dot decimal)', () => {
    expect(parseLocaleNumber('3,000.00', 'US')).toBe(3000.00);
    expect(parseLocaleNumber('2.852', 'US')).toBe(2.852);
  });

  it('parses simple numbers', () => {
    expect(parseLocaleNumber('1234')).toBe(1234);
    expect(parseLocaleNumber('1234.56', 'US')).toBe(1234.56);
    expect(parseLocaleNumber('1234,56', 'EU')).toBe(1234.56);
  });

  it('detects locale correctly from samples', () => {
    expect(detectLocale(['3.000,00', '3.877,3'])).toBe('EU');
    expect(detectLocale(['3,000.00', '2.852'])).toBe('US');
    expect(detectLocale(['3877,3'])).toBe('EU'); // Comma only decimal
    expect(detectLocale(['2.852'])).toBe('EU'); // German thousands (dot only with 3 digits)
    expect(detectLocale(['1.2345'])).toBe('US'); // Dot with > 3 digits -> US
  });

  it('handles whitespace', () => {
    expect(parseLocaleNumber(' 1 234,56 ', 'EU')).toBe(1234.56);
  });

  it('returns NaN for empty or invalid input', () => {
    expect(parseLocaleNumber('', 'EU')).toBeNaN();
    expect(parseLocaleNumber('abc', 'EU')).toBeNaN();
  });

  it('defaults to EU locale when no locale provided', () => {
    expect(parseLocaleNumber('3877,3')).toBe(3877.3);
    expect(parseLocaleNumber('2.852')).toBe(2852);
  });
});

describe('detectLocale', () => {
  it('detects EU from comma-decimal values', () => {
    expect(detectLocale(['3877,3', '4051,5', '4698'])).toBe('EU');
  });

  it('detects EU from dot-thousands values', () => {
    expect(detectLocale(['2.852', '4.914', '5.912'])).toBe('EU');
  });

  it('detects EU from mixed EU separators', () => {
    expect(detectLocale(['3.877,3', '4.051,5'])).toBe('EU');
  });

  it('detects US from dot-decimal values with comma thousands', () => {
    expect(detectLocale(['3,877.3', '4,051.5'])).toBe('US');
  });

  it('defaults to EU on plain integers', () => {
    expect(detectLocale(['4698', '4914', '6511'])).toBe('EU');
  });

  it('handles mixed EU dataset like the clipboard example', () => {
    const sample = ['2.852', '3877,3', '3883,4', '4051,5', '4698', '4914'];
    expect(detectLocale(sample)).toBe('EU');
  });
});
