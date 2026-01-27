/**
 * Parses a string representation of a number into a float,
 * handling different locales like EU (3.000,00) and US (3,000.00).
 */
export const parseLocaleNumber = (val: string): number => {
  if (!val) {return NaN;}
  
  // Remove all whitespace
  let clean = val.replace(/\s/g, '');
  
  // Find last separator (comma or dot)
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  
  if (lastComma > lastDot) {
      // European style (3.000,00) or just comma decimal (3877,3)
      // Remove all dots (thousands), replace last comma with dot
      clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
      // US style (3,000.00) or just dot decimal (2.852)
      // Remove all commas (thousands)
      clean = clean.replace(/,/g, '');
  } else {
      // No separators or ambiguous - just try to parse
  }
  
  return parseFloat(clean);
};
