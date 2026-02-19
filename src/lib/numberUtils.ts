export type NumberLocale = 'EU' | 'US';

/**
 * Parses a string representation of a number into a float,
 * handling different locales like EU (3.000,00) and US (3,000.00).
 * @param locale Hint for ambiguous formats like "1.234"
 */
export const parseLocaleNumber = (val: string, locale: NumberLocale = 'EU'): number => {
  if (!val) {return NaN;}
  
  // Remove all whitespace
  let clean = val.replace(/\s/g, '');
  
  if (locale === 'EU') {
      // European style: dot = thousands, comma = decimal
      clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
      // US style: comma = thousands, dot = decimal
      clean = clean.replace(/,/g, '');
  }
  
  return parseFloat(clean);
};

/** Returns +N for EU evidence, -N for US evidence from a single value string. */
const scoreValue = (val: string): number => {
  const hasDot = val.includes('.');
  const hasComma = val.includes(',');

  if (hasDot && hasComma) {
    return val.lastIndexOf(',') > val.lastIndexOf('.') ? 2 : -2;
  }
  if (hasComma) { return 1; } // comma-only decimal: 3877,3 → EU
  if (hasDot) {
    const afterDot = val.split('.').pop() ?? '';
    // German thousands: 2.852 means 2852 (exactly 3 digits after dot)
    if (afterDot.length === 3 && /^\d+$/.test(afterDot)) {
        return 1;
    }
    // US decimal: 1.2 or 1.2345 (dot with NOT 3 digits)
    return -1;
  }
  return 0;
};

/**
 * Heuristically detects the number locale from a sample of raw value strings.
 * Returns 'EU' as default when evidence is insufficient.
 */
export const detectLocale = (values: string[]): NumberLocale => {
  const score = values
    .map(raw => (typeof raw === 'string' ? raw : String(raw)).replace(/\s/g, ''))
    .filter(Boolean)
    .reduce((acc, val) => acc + scoreValue(val), 0);

  return score >= 0 ? 'EU' : 'US';
};
