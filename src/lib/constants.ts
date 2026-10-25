/** App-wide constants. Centralised so there are no magic numbers in logic. */

export const APP_TITLE = 'Weight Tracker';

/** Excel sheet names — kept identical to the original desktop app for compat. */
export const SHEET_DAILY = 'Daily Data';
export const SHEET_WEEKLY = 'Weekly Averages';

/** Valid body-weight range for input and import (kg). */
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 250;

/**
 * Dead-bands (kg) for classifying a change as a loss/gain rather than "flat".
 * These mirror the thresholds used in the original desktop application.
 */
export const DELTA_BAND = 0.05; // daily / weekly table cells
export const RATE_BAND = 0.05; // rate metric (kg/week)
export const WEEK_BAND = 0.01; // week-over-week metric & bar labels

/** Window (days) for the moving-average overlay. */
export const MA_WINDOW = 7;

/**
 * Fewest weigh-ins a 7-day calendar window needs before its average is drawn
 * as a solid line. Windows with fewer are bridged with a dashed segment.
 */
export const MA_MIN_COUNT = 2;

/** Change (kg) between consecutive 7-day averages read as "steady". */
export const TREND_BAND = 0.2;

/** Window (days) for the recent rate of change (kg/week). */
export const RATE_WINDOW = 28;

/** z for the projection range: about an 80% interval on the 28-day rate. */
export const PROJECTION_Z = 1.28;

/** Maintaining: warn when the 7-day average is this close (kg) to an edge… */
export const DRIFT_NEAR = 0.3;
/** …or when the recent rate would carry it past one within this many days… */
export const DRIFT_DAYS = 21;
/** …measured over this many days. */
export const DRIFT_WINDOW = 14;

/** Upper bound (weeks) for a sensible goal projection. */
export const MAX_PROJECTION_WEEKS = 260;

/** LocalStorage/IndexedDB key for the persisted app state. */
export const STORAGE_KEY = 'weight-tracker:state:v1';

/** How long the undo action stays on a toast (ms). */
export const UNDO_MS = 8000;
