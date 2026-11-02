import { parse } from 'date-fns';

export type DateLocale = 'EU' | 'US';

function tryParseFormat(val: string, format: string): Date | null {
  const d = parse(val, format, new Date());
  if (isNaN(d.getTime())) { return null; }
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Robustly parses a date string into a Date object,
 * handling common formats like DD.MM.YYYY, YYYY-MM-DD, etc.
 * @param locale Hint for ambiguous formats like 01/05/2022
 */
export const parseFlexibleDate = (val: string, locale: DateLocale = 'EU'): Date | null => {
  if (!val) {return null;}
  const clean = val.trim();
  
  // 1. Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {return d;}
  }
  
  // 2. Try European format with dots (DD.MM.YYYY)
  if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(clean)) {
    return tryParseFormat(clean, 'dd.MM.yyyy');
  }
  
  // 3. Try format with slashes (DD/MM/YYYY or MM/DD/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
    const firstPart = parseInt(clean.split('/')[0]);
    if (firstPart > 12) {
      return tryParseFormat(clean, 'dd/MM/yyyy');
    }
    return locale === 'US' ? tryParseFormat(clean, 'MM/dd/yyyy') : tryParseFormat(clean, 'dd/MM/yyyy');
  }

  const final = new Date(clean);
  return isNaN(final.getTime()) ? null : final;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Calendar day index of a local date, independent of DST (23/25-hour days). */
const calendarDayIndex = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;

/** Number of calendar days from start to end, both inclusive (03.10.–02.11. → 31). */
export function countDaysInclusive(start: Date, end: Date): number {
  return calendarDayIndex(end) - calendarDayIndex(start) + 1;
}

/**
 * "Last N days" ending today: exactly N calendar days including today,
 * from local midnight N−1 days ago to the end of today.
 */
export function lastNDaysRange(days: number, today: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1), 0, 0, 0, 0);
  return { start, end };
}
