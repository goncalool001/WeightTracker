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
  /** Optional short note: what was different that day. */
  note?: string;
  /** Optional categories (ids from domain/categories) explaining the weigh-in. */
  tags?: string[];
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

/** A projection of when the goal weight will be reached. */
export interface GoalProjection {
  /** ISO date the goal is projected to be hit. */
  date: string;
  /** Whole/fractional weeks remaining until the goal. */
  weeksRemaining: number;
}

/**
 * A goal. `lose` and `gain` aim for a target weight (low = high = target);
 * `maintain` keeps the weight inside a range (target = its midpoint). Goals
 * are kept as a history: the current goal is the one with `endedOn === null`.
 * Older saves used `reach` for both directions; it is converted on load.
 */
export type GoalMode = 'lose' | 'gain' | 'maintain';

/** A goal mode as it may arrive from an older save or the cloud. */
export type StoredGoalMode = GoalMode | 'reach';

/** A goal as it may arrive from an older save or the cloud. */
export type StoredGoal = Omit<Goal, 'mode'> & { mode: StoredGoalMode };

export interface Goal {
  mode: GoalMode;
  target: number;
  low: number;
  high: number;
  /** ISO date the goal was set. */
  setOn: string;
  /** ISO date the goal was replaced or removed; `null` while current. */
  endedOn: string | null;
}

/** One calendar day of the rolling 7-day average. */
export interface CalendarAveragePoint {
  date: string;
  /** Mean of the weigh-ins in [date − 6, date], or null when too few. */
  average: number | null;
  /** Weigh-ins inside the window. */
  count: number;
}

/** Chart overlay for the daily view (mutually exclusive). */
export type Overlay = 'trend' | 'ma';

/** Time-range filter applied to charts and tables. */
export type RangeKey = '7d' | '30d' | '90d' | 'ytd' | 'all' | 'custom';

/** The dates of a custom range, inclusive. */
export interface CustomRange {
  from: string;
  to: string;
}

/** Icon identifier for an insight (kept for ordering and tests). */
export type InsightIcon =
  | 'goalPace'
  | 'progress'
  | 'window'
  | 'accel'
  | 'consistency'
  | 'best'
  | 'contribution'
  | 'compare'
  | 'band'
  | 'weekday'
  | 'category';

/** Sentiment of an insight. */
export type InsightTone = 'good' | 'bad' | 'neutral' | 'accent';

/**
 * A single generated insight, rendered as a row in the analytical feed. Each
 * is a full sentence surfacing a pattern not already shown by the KPI strip.
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
  windowLost: (kg: string, days: number) => string;
  windowGained: (kg: string, days: number) => string;
  accelAccel: (recent: string, prior: string) => string;
  accelSlow: (recent: string, prior: string) => string;
  consistency: (drops: number, m: number) => string;
  bestWeek: (start: string, end: string, kg: string) => string;
  contribution: (pct: string) => string;
  compareStronger: (thisRate: string, lastRate: string) => string;
  compareWeaker: (thisRate: string, lastRate: string) => string;
  avgSpread: (lo: string, hi: string, days: number) => string;
  /** A category (by its label) linked to heavier or lighter weigh-ins. */
  categoryEffect: (label: string, kg: string, n: number, heavier: boolean) => string;
  /** `day`: 0 = Sunday. `heavier`: above the week's own average. */
  weekday: (day: number, kg: string, heavier: boolean) => string;
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
  /** Goal history, oldest first. The current goal has `endedOn === null`. */
  goals: StoredGoal[];
  /**
   * Legacy single goal weight (pre-history). Read on hydrate to migrate older
   * saves and still written to the cloud for older clients.
   */
  goalWeight?: number | null;
  overlay: Overlay;
  range: RangeKey;
  /** Dates for the `custom` range; kept when another range is picked. */
  customRange?: CustomRange | null;
  granularity: Granularity;
  theme: Theme;
  locale: Locale;
  seeded: boolean;
}

/** Screens reachable from the navigation (hash routes). */
export type Route = 'today' | 'log' | 'goal' | 'data';
