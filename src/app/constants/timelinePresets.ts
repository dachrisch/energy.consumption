/**
 * Timeline Presets Configuration
 *
 * Defines preset date ranges for quick filter selection.
 * Each preset calculates its date range dynamically based on current date.
 */

export interface TimelinePreset {
  id: string;
  label: string;
  calculateRange: () => { start: Date; end: Date };
}

/**
 * Get the start of today (00:00:00)
 */
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Get the start of a specific day
 */
const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Available timeline presets
 */
export const TIMELINE_PRESETS: readonly TimelinePreset[] = [
  {
    id: 'last-7-days',
    label: 'Last 7 days',
    calculateRange: () => {
      const end = getToday();
      const start = new Date(end);
      start.setDate(start.getDate() - 6); // Today minus 6 days = 7 days total
      return { start: getStartOfDay(start), end };
    },
  },
  {
    id: 'last-30-days',
    label: 'Last 30 days',
    calculateRange: () => {
      const end = getToday();
      const start = new Date(end);
      start.setDate(start.getDate() - 29); // Today minus 29 days = 30 days total
      return { start: getStartOfDay(start), end };
    },
  },
  {
    id: 'last-90-days',
    label: 'Last 90 days',
    calculateRange: () => {
      const end = getToday();
      const start = new Date(end);
      start.setDate(start.getDate() - 89); // Today minus 89 days = 90 days total
      return { start: getStartOfDay(start), end };
    },
  },
  {
    id: 'this-month',
    label: 'This month',
    calculateRange: () => {
      const end = getToday();
      const start = new Date(end.getFullYear(), end.getMonth(), 1); // 1st of current month
      return { start: getStartOfDay(start), end };
    },
  },
  {
    id: 'this-year',
    label: 'This year',
    calculateRange: () => {
      const end = getToday();
      const start = new Date(end.getFullYear(), 0, 1); // January 1st of current year
      return { start: getStartOfDay(start), end };
    },
  },
] as const;

/**
 * Get preset by ID
 */
export const getPresetById = (id: string): TimelinePreset | undefined => {
  return TIMELINE_PRESETS.find((preset) => preset.id === id);
};
