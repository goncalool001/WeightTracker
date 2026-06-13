import type { RangeKey } from '@/types';

/** App-wide constants. Centralised so there are no magic numbers in logic. */

export const APP_TITLE = 'Weight Tracker';

/** Excel sheet names — kept identical to the original desktop app for compat. */
export const SHEET_DAILY = 'Daily Data';
export const SHEET_WEEKLY = 'Weekly Averages';

/** Valid body-weight range for input (kg). */
export const WEIGHT_MIN = 20;
export const WEIGHT_MAX = 300;
export const WEIGHT_STEP = 0.1;

/**
 * Dead-bands (kg) for classifying a change as a loss/gain rather than "flat".
 * These mirror the thresholds used in the original desktop application.
 */
export const DELTA_BAND = 0.05; // daily / weekly table cells
export const RATE_BAND = 0.05; // rate metric (kg/week)
export const WEEK_BAND = 0.01; // week-over-week metric & bar labels

/** Max number of daily points before per-point value labels are hidden. */
export const MAX_POINT_LABELS = 45;

/** Window (days) for the moving-average overlay. */
export const MA_WINDOW = 7;

/** Upper bound (weeks) for a sensible goal projection. */
export const MAX_PROJECTION_WEEKS = 260;

/** LocalStorage/IndexedDB key for the persisted app state. */
export const STORAGE_KEY = 'weight-tracker:state:v1';

/** Time-range filter options shown in the UI, in display order. */
export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All' },
];

/** Human-readable phrase for each range, used in insight copy. */
export const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  ytd: 'this year',
  all: 'all time',
};
