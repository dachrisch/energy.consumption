/**
 * Single place for number, currency and date formatting in the UI.
 * UI words stay English; numbers and dates use German conventions (de-DE),
 * matching the data (German suppliers, € prices, dd.mm.yyyy dates).
 */
export const FORMAT_LOCALE = 'de-DE';

const numberFormat = (min: number, max: number) =>
  new Intl.NumberFormat(FORMAT_LOCALE, { minimumFractionDigits: min, maximumFractionDigits: max });

/** 731.66 → "731,66 €"; with decimals 0: 979 → "979 €". */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat(FORMAT_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Unit price with four decimals: 0.922 → "0,9220 €/m³". */
export function formatPrice(value: number, unit: string): string {
  return `${formatCurrency(value, 4)}/${unit}`;
}

/** 1473 → "1.473", 5.5234 → "5,52" (up to `maxDecimals`, no trailing zeros). */
export function formatNumber(value: number, maxDecimals = 2): string {
  return numberFormat(0, maxDecimals).format(value);
}

/** Fixed decimals: formatFixed(5.5, 2) → "5,50". */
export function formatFixed(value: number, decimals: number): string {
  return numberFormat(decimals, decimals).format(value);
}

/** 1473 kWh → "1.473 kWh". */
export function formatQuantity(value: number, unit: string, maxDecimals = 2): string {
  return `${formatNumber(value, maxDecimals)} ${unit}`;
}

/** 7.3 → "7,3 %". */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatFixed(value, decimals)} %`;
}

const toDate = (value: Date | string | number): Date => (value instanceof Date ? value : new Date(value));

/** "30.04.2026" */
export function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat(FORMAT_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(toDate(value));
}

/** "30.04." (day and month only, e.g. next to a separate year). */
export function formatDayMonth(value: Date | string | number): string {
  return new Intl.DateTimeFormat(FORMAT_LOCALE, { day: '2-digit', month: '2-digit' }).format(toDate(value));
}

/** "03.10.2026 – 02.11.2026"; an open end reads "Present". */
export function formatDateRange(start: Date | string | number, end?: Date | string | number | null): string {
  return `${formatDate(start)} – ${end ? formatDate(end) : 'Present'}`;
}
