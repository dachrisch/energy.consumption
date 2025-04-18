export const parseDateFlexible = (dateStr: string): Date => {
  const formats: RegExp[] = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let day: number, month: number, year: number;

      if (format.source.startsWith("^(\\d{4})")) {
        // Format: YYYY-MM-DD or YYYY/MM/DD
        [, year, month, day] = match.map(Number);
      } else {
        // Format: DD/MM/YYYY, DD.MM.YYYY, or DD-MM-YYYY
        [, day, month, year] = match.map(Number);
      }

      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  throw new Error(`Unrecognized or unsupported date format: ${dateStr}`);
};

type DateFormatter = (date: Date) => string;

export const formatDateToBrowserLocale: DateFormatter = (
  date: Date
): string => {
  console.log(`date: ${date}, type: ${typeof date}`)
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const formatDateToIso: DateFormatter = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
