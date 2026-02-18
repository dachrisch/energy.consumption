/**
 * Parses a date string into a Date object, handling multiple formats.
 * Supports DD.MM.YYYY, DD/MM/YYYY, and ISO 8601 (YYYY-MM-DD).
 */
export const parseDate = (str: string): Date => {
  if (!str) { return new Date(NaN); }

  const trimmed = str.trim();

  // DD.MM.YYYY or DD.MM.YY
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }

  // DD/MM/YYYY or DD/MM/YY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }

  // Fallback: ISO 8601 and other formats the JS Date constructor handles
  return new Date(trimmed);
};
