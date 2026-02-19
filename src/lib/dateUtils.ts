import { parse } from 'date-fns';

export type DateLocale = 'EU' | 'US';

function tryParseFormat(val: string, format: string): Date | null {
  const d = parse(val, format, new Date());
  return isNaN(d.getTime()) ? null : d;
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
