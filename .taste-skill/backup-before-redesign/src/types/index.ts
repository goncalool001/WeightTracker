/**
 * Core domain types. Dates are stored as ISO `YYYY-MM-DD` strings (no time/tz),
 * which makes them trivially comparable, sortable and serialisable to JSON.
 */

/** A single weight measurement on a given calendar day. */
export interface WeightEntry {
  /** ISO calendar date, `YYYY-MM-DD`. Unique within a dataset. */
  date: string;
  /** Body weight in kilograms. */
  weight: number;
}

/** A Monday–Sunday week aggregate, derived from daily entries. */
export interface WeeklyAverage {
  /** ISO date of the Monday that starts the week. */
  weekStart: string;
  /** ISO date of the Sunday that ends the week. */
  weekEnd: string;
  /** Mean of the week's measurements, rounded to 2 dp. */
  averageWeight: number;
  /** Number of measurements that fell in the week. */
  measurements: number;
}

/** Aggregation granularity for the period chart/table. */
export type Granularity = 'weekly' | 'monthly';

/**
 * A generic period (week or month) aggregate. `number` is the 1-based sequence
 * position within the *full* dataset (first recorded period = 1), independent
 * of any active range filter.
 */
export interface PeriodAverage {
  /** Dataset-based sequence number (first recorded period = 1). */
  number: number;
  /** ISO date of the first day of the period. */
  start: string;
  /** ISO date of the last day of the period. */
  end: string;
  /** Human label, e.g. "25 May – 31 May 2026" or "May 2026". */
  label: string;
  /** Mean of the period's measurements, rounded to 2 dp. */
  average: number;
  /** Number of measurements that fell in the period. */
  measurements: number;
}

/** Result of a least-squares degree-1 fit: `y = slope * x + intercept`. */
export interface LinearFit {
  slope: number;
  intercept: number;
}

/** Direction of a change, used to colour deltas. */
export type DeltaDirection = 'down' | 'up' | 'flat';

/** A value paired with its change vs. the previous period. */
export interface DeltaResult {
  /** The change vs. the previous period, or `null` for the first point. */
  delta: number | null;
  direction: DeltaDirection;
}

/** Headline statistics shown in the metric cards. */
export interface Metrics {
  totalEntries: number;
  latest: { weight: number; date: string } | null;
  thisWeek: { average: number; measurements: number } | null;
  vsLastWeek: { average: number; delta: number } | null;
  sinceStart: { firstAverage: number; currentAverage: number; delta: number } | null;
  /** Trend rate of change in kg per week, or `null` if < 2 entries. */
  ratePerWeek: number | null;
}

/** A projection of when the goal weight will be reached. */
export interface GoalProjection {
  /** ISO date the goal is projected to be hit. */
  date: string;
  /** Whole/fractional weeks remaining until the goal. */
  weeksRemaining: number;
}

/** Chart overlay for the daily view (mutually exclusive). */
export type Overlay = 'trend' | 'ma';

/** Time-range filter applied to charts and tables. */
export type RangeKey = '7d' | '30d' | '90d' | 'ytd' | 'all';

/** Icon identifier for an insight (mapped to a concrete icon in the UI). */
export type InsightIcon =
  | 'goalPace'
  | 'progress'
  | 'window'
  | 'accel'
  | 'consistency'
  | 'best'
  | 'contribution'
  | 'compare';

/** Sentiment of an insight, used for colour. */
export type InsightTone = 'good' | 'bad' | 'neutral' | 'accent';

/**
 * A single generated insight, rendered as a row in the analytical feed. Each
 * is a full sentence surfacing a pattern not already shown by the KPI cards.
 */
export interface Insight {
  id: string;
  icon: InsightIcon;
  tone: InsightTone;
  /** Full-sentence observation. */
  text: string;
  /** Optional 0–100 value rendered as a progress bar (e.g. goal progress). */
  progress?: number;
}

/** UI colour theme. */
export type Theme = 'light' | 'dark';

/** Locale-specific string factories for the Insight generator. */
export interface InsightStrings {
  reachedGoal: (g: string) => string;
  goalPace: (g: string, date: string, weeks: number) => string;
  progress: (pct: string, startKg: string, goalKg: string) => string;
  windowLost: (kg: string, days: number) => string;
  windowGained: (kg: string, days: number) => string;
  accelAccel: (recent: string, prior: string) => string;
  accelSlow: (recent: string, prior: string) => string;
  consistency: (drops: number, m: number) => string;
  bestWeek: (start: string, end: string, kg: string) => string;
  contribution: (pct: string) => string;
  compareStronger: (thisRate: string, lastRate: string) => string;
  compareWeaker: (thisRate: string, lastRate: string) => string;
}

/** App language / UI locale. */
export type Locale = 'en' | 'pt';

/** The signed-in user (for cloud sync), or null when signed out. */
export interface SyncUser {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}

/** The serialisable slice of app state that is persisted locally. */
export interface PersistedState {
  entries: WeightEntry[];
  goalWeight: number | null;
  overlay: Overlay;
  range: RangeKey;
  granularity: Granularity;
  theme: Theme;
  locale: Locale;
  showLabels: boolean;
  seeded: boolean;
}
