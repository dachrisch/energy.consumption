import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDayMonth,
  formatFixed,
  formatNumber,
  formatPercent,
  formatPrice,
  formatQuantity,
} from '../format';

// Intl uses a (narrow) no-break space before "€"; compare with plain spaces
const plain = (s: string) => s.replace(/[  ]/g, ' ');

describe('format (de-DE)', () => {
  it('formats currency', () => {
    expect(plain(formatCurrency(731.66))).toBe('731,66 €');
    expect(plain(formatCurrency(979.4, 0))).toBe('979 €');
    expect(plain(formatCurrency(1566))).toBe('1.566,00 €');
  });

  it('formats unit prices with four decimals', () => {
    expect(plain(formatPrice(0.922, 'm³'))).toBe('0,9220 €/m³');
    expect(plain(formatPrice(0.3055, 'kWh'))).toBe('0,3055 €/kWh');
  });

  it('formats numbers and quantities with German separators', () => {
    expect(formatNumber(5912)).toBe('5.912');
    expect(formatNumber(4051.5)).toBe('4.051,5');
    expect(formatNumber(171.2567)).toBe('171,26');
    expect(formatFixed(5.5, 2)).toBe('5,50');
    expect(formatQuantity(1473, 'kWh')).toBe('1.473 kWh');
    expect(formatPercent(7.3)).toBe('7,3 %');
  });

  it('formats dates as dd.mm.yyyy', () => {
    expect(formatDate(new Date(2026, 3, 30))).toBe('30.04.2026');
    expect(formatDayMonth(new Date(2026, 3, 30))).toBe('30.04.');
    expect(formatDateRange(new Date(2026, 9, 3), new Date(2026, 10, 2))).toBe('03.10.2026 – 02.11.2026');
    expect(formatDateRange(new Date(2026, 0, 1), null)).toBe('01.01.2026 – Present');
  });
});
