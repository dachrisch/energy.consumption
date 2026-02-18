export type NumberLocale = 'EU' | 'US';

/**
 * Parses a number string using an explicit locale.
 * EU: dot = thousands separator, comma = decimal  (e.g. 3.877,3 → 3877.3)
 * US: comma = thousands separator, dot = decimal  (e.g. 3,877.3 → 3877.3)
 */
export const parseLocaleNumber = (val: string, locale: NumberLocale = 'EU'): number => {
  if (!val) { return NaN; }

  let clean = val.replace(/\s/g, '');

  if (locale === 'EU') {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
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
    return afterDot.length === 3 && /^\d+$/.test(afterDot) ? 1 : 0;
  }
  return 0;
};

/**
 * Heuristically detects the number locale from a sample of raw value strings.
 *
 * Votes EU when:
 *   - Any value has both separators with comma last  (e.g. 3.877,3)
 *   - Any value has only a comma                    (e.g. 3877,3)
 *   - Any value has a dot followed by exactly 3 digits and no comma
 *     (German thousands: 2.852 means 2852)
 *
 * Votes US when:
 *   - Any value has both separators with dot last   (e.g. 3,877.3)
 *
 * Returns 'EU' as default when evidence is insufficient.
 */
export const detectLocale = (values: string[]): NumberLocale => {
  const score = values
    .map(raw => raw.replace(/\s/g, ''))
    .filter(Boolean)
    .reduce((acc, val) => acc + scoreValue(val), 0);

  return score >= 0 ? 'EU' : 'US';
};
