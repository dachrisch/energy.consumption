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
    // Remove all dots (thousands sep), replace last comma with decimal point
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    // Remove all commas (thousands sep), keep dot as decimal
    clean = clean.replace(/,/g, '');
  }

  return parseFloat(clean);
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
  let euVotes = 0;
  let usVotes = 0;

  for (const raw of values) {
    const val = raw.replace(/\s/g, '');
    if (!val) { continue; }

    const hasDot = val.includes('.');
    const hasComma = val.includes(',');

    if (hasDot && hasComma) {
      const lastDot = val.lastIndexOf('.');
      const lastComma = val.lastIndexOf(',');
      if (lastComma > lastDot) {
        euVotes += 2; // Strong signal: 3.000,00
      } else {
        usVotes += 2; // Strong signal: 3,000.00
      }
    } else if (hasComma && !hasDot) {
      euVotes += 1; // Comma-only decimal: 3877,3
    } else if (hasDot && !hasComma) {
      // Ambiguous dot-only: check if exactly 3 digits follow the dot
      const afterDot = val.split('.').pop() ?? '';
      if (afterDot.length === 3 && /^\d+$/.test(afterDot)) {
        euVotes += 1; // Likely German thousands: 2.852
      }
      // else: treat as plain decimal, no vote
    }
  }

  return euVotes >= usVotes ? 'EU' : 'US';
};
