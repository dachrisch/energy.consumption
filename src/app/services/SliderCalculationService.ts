/**
 * Slider Calculation Service
 *
 * Pure functions for converting between dates and pixel positions on the timeline slider.
 * All calculations are relative to a date range and container width.
 *
 * Core concept:
 * - Date range maps to pixel range [0, containerWidth]
 * - Linear interpolation between dates and positions
 * - All values clamped to valid ranges
 */

/**
 * Convert a date to a pixel position on the slider
 *
 * @param date - The date to convert
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param containerWidth - Width of slider container in pixels
 * @returns Pixel position (may be outside [0, containerWidth] if date is outside range)
 */
export function dateToPosition(
  date: Date,
  startDate: Date,
  endDate: Date,
  containerWidth: number
): number {
  const totalMs = endDate.getTime() - startDate.getTime();

  if (totalMs === 0) {
    return 0;
  }

  const dateMs = date.getTime() - startDate.getTime();
  const ratio = dateMs / totalMs;

  return ratio * containerWidth;
}

/**
 * Convert a pixel position to a date
 *
 * @param position - Pixel position on the slider
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param containerWidth - Width of slider container in pixels
 * @returns Date corresponding to the position
 */
export function positionToDate(
  position: number,
  startDate: Date,
  endDate: Date,
  containerWidth: number
): Date {
  if (containerWidth === 0) {
    return new Date(startDate);
  }

  const totalMs = endDate.getTime() - startDate.getTime();
  const ratio = position / containerWidth;
  const offsetMs = ratio * totalMs;

  return new Date(startDate.getTime() + offsetMs);
}

/**
 * Clamp a position value to a valid range
 *
 * @param position - Position to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped position
 */
export function clampPosition(position: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, position));
}

/**
 * Clamp a date to a valid range
 *
 * @param date - Date to clamp
 * @param minDate - Minimum date
 * @param maxDate - Maximum date
 * @returns Clamped date
 */
export function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  const dateTime = date.getTime();
  const minTime = minDate.getTime();
  const maxTime = maxDate.getTime();

  if (dateTime < minTime) return new Date(minDate);
  if (dateTime > maxTime) return new Date(maxDate);
  return new Date(date);
}

/**
 * Calculate date from position with automatic clamping
 *
 * @param position - Pixel position on the slider
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param containerWidth - Width of slider container in pixels
 * @returns Date (clamped to valid range)
 */
export function calculateDateFromPosition(
  position: number,
  startDate: Date,
  endDate: Date,
  containerWidth: number
): Date {
  // Clamp position first
  const clampedPosition = clampPosition(position, 0, containerWidth);

  // Convert to date
  const date = positionToDate(clampedPosition, startDate, endDate, containerWidth);

  // Clamp date (extra safety)
  return clampDate(date, startDate, endDate);
}

/**
 * Calculate position from date with automatic clamping
 *
 * @param date - The date to convert
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param containerWidth - Width of slider container in pixels
 * @returns Position (clamped to valid range)
 */
export function calculatePositionFromDate(
  date: Date,
  startDate: Date,
  endDate: Date,
  containerWidth: number
): number {
  // Clamp date first
  const clampedDate = clampDate(date, startDate, endDate);

  // Convert to position
  const position = dateToPosition(clampedDate, startDate, endDate, containerWidth);

  // Clamp position (extra safety)
  return clampPosition(position, 0, containerWidth);
}

/**
 * Check if a date range is valid
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns True if range is valid (start <= end and both are valid dates)
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  if (!startDate || !endDate) return false;
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
  return startDate.getTime() <= endDate.getTime();
}

/**
 * Normalize a date range by swapping if necessary
 * Ensures start <= end
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Normalized date range
 */
export function normalizeDateRange(
  startDate: Date,
  endDate: Date
): { start: Date; end: Date } {
  if (startDate.getTime() <= endDate.getTime()) {
    return { start: startDate, end: endDate };
  }

  return { start: endDate, end: startDate };
}

/**
 * Calculate the percentage a date represents in a range
 *
 * @param date - The date
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Percentage (0-100)
 */
export function dateToPercentage(date: Date, startDate: Date, endDate: Date): number {
  const totalMs = endDate.getTime() - startDate.getTime();

  if (totalMs === 0) {
    return 0;
  }

  const dateMs = date.getTime() - startDate.getTime();
  const ratio = dateMs / totalMs;

  return Math.max(0, Math.min(100, ratio * 100));
}

/**
 * Add days to a date
 *
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add hours to a date
 * Used for fine-grained keyboard control (Shift + Arrow)
 *
 * @param date - Starting date
 * @param hours - Number of hours to add (can be negative)
 * @returns New date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
  return result;
}

/**
 * Calculate distance between two dates in days
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days (absolute value)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / msPerDay);
}
