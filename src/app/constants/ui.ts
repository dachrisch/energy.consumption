/**
 * UI-related constants
 */

export const ITEMS_PER_PAGE = 10;

export const ALERT_TIMEOUT_MS = 4000;

export const REDIRECT_DELAY_MS = 1000;

export const TOGGLE_BUTTON_STYLES = {
  active: "bg-blue-500 text-white",
  inactive: "bg-gray-200 text-gray-700",
} as const;

/**
 * Chart-related constants
 */
export const CHART_YEAR_RANGE = {
  past: 2,
  future: 3,
} as const;

export const CHART_BORDER_DASH = {
  interpolated: [5, 5] as number[],
  extrapolated: [10, 5] as number[],
};

export const CHART_POINT_RADIUS = {
  normal: 4,
  special: 3, // For interpolated/extrapolated points
} as const;

export const MONTHS_PER_YEAR = 12;

/**
 * Cost calculation constants
 */
export const MAX_DATE_YEAR = 9999;
export const MAX_DATE_MONTH = 11; // December (0-indexed)
export const MAX_DATE_DAY = 31;

export const EXTRAPOLATION_PERIODS = 3;
export const LOOKBACK_PERIODS = 3;
