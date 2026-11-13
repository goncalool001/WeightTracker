import {
  DRIFT_DAYS,
  DRIFT_NEAR,
  DRIFT_WINDOW,
  MAX_PROJECTION_WEEKS,
  MA_WINDOW,
  PROJECTION_Z,
  RATE_WINDOW,
  TREND_BAND,
} from '@/lib/constants';
import {
  addDaysISO,
  averageBetween,
  daysBetween,
  monthStartISO,
  prevMonthStartISO,
  countInBand,
  rateOverWindow,
  rateWithError,
  staySince,
  todayISO,
  weekStartISO,
  windowAverage,
} from './calendar';
import { roundWeight } from './entries';
import { currentGoal, goalReachedOn, isTargetGoal, lastReachedTarget, paceState, type PaceState } from './goals';
import { changeDirection, resolveScope, type Good, type Scope } from './scope';
import type { DeltaDirection, Goal, ScopeKey, WeightEntry } from '@/types';

/**
 * The screen's answer, computed once. Every figure the Today screen shows
 * comes from here, so a fact that appears twice (the h1 and a KPI, the ruler
 * and the chart) is the same value.
 *
 * Changes are taken between the values as displayed (rounded to 0.1 kg), so
 * "76.7 vs 76.8" always reads as −0.1.
 *
 * Phases: `reach` is on the way to a lose or gain target, `reached` has passed
 * it, `maintain` keeps the weight inside a range.
 *
 * Everything is computed inside a scope (see scope.ts): the goal in force
 * since it was set, an earlier goal frozen on the day it ended, or the whole
 * history. Totals, pace, progress and the 7-day average use the scope's own
 * weigh-ins, so a cut that came before a bulk never counts against the bulk.
 */

export type Phase = 'empty' | 'none' | 'reach' | 'reached' | 'maintain';
export type BandPosition = 'below' | 'inside' | 'above';

/** A calendar period (this week, this month) against the one before it. */
export interface PeriodCompare {
  start: string;
  avg: number | null;
  count: number;
  prevAvg: number | null;
  prevCount: number;
  delta: number | null;
  /**
   * How the change is judged: by the goal in force when both periods lie
   * under one direction, else `null` (shown without a verdict).
   */
  good: Good;
}

export interface Status {
  phase: Phase;
  /** What these figures cover. */
  scope: Pick<Scope, 'kind' | 'key' | 'closed' | 'from' | 'to' | 'good' | 'hasCurrentGoal'>;
  /** The scope's latest weigh-in. */
  latest: WeightEntry | null;
  /** The weigh-in the scope starts from. */
  first: WeightEntry | null;
  /** Latest minus the scope's first weigh-in. */
  sinceStart: number | null;
  /** 7-day calendar average ending on the latest weigh-in (rounded 0.1). */
  avg7: number | null;
  avg7Count: number;
  /** The 7 days before that. */
  avg7Prev: number | null;
  /** avg7 − avg7Prev, from the rounded values. */
  avg7Delta: number | null;
  /**
   * This calendar week (Monday to today) against the whole week before:
   * averages rounded to 0.1, delta from the rounded values. These are levels
   * of the whole history (a week is a week whatever the goal); only the
   * verdict on the change depends on the goal. `null` for a past goal.
   */
  week: PeriodCompare | null;
  /** The same for this calendar month against the whole month before. */
  month: PeriodCompare | null;
  /** down / up / flat by the 0.2 kg band; null with too little data. */
  trend: DeltaDirection | null;
  /** kg per week over the last 28 days of the scope, or null. */
  rate: number | null;
  /** The scope's start, while it is younger than the 28-day window the rate uses. */
  rateSince: string | null;
  /**
   * The pace the goal aims for (signed: negative for a goal to lose) and
   * whether the real pace keeps up with it; `state` is null until there is a
   * real pace to compare. Null without a target pace, and for a past goal.
   */
  pace: { target: number; state: PaceState | null } | null;
  goal: Goal | null;
  /** A past goal: how long it ran, its average pace, and how far short it ended. */
  closed: { days: number; avgRate: number | null; short: number | null } | null;

  // lose / gain
  /** Distance still to go to the target (always ≥ 0 until it is passed). */
  toGo: number | null;
  /**
   * When the target is reached at the 28-day rate, as a range: `early` at the
   * faster end of the rate's uncertainty, `late` at the slower end (null when
   * the slower end is not heading to the target at all). Null when the rate
   * itself is not heading the right way.
   */
  projection: { early: string; late: string | null } | null;
  /** Where the progress is measured from: the scope's first weigh-in. */
  journeyStart: WeightEntry | null;
  /** 0–100 share of the way from `journeyStart` to the target. */
  progress: number | null;
  /** The weigh-in that passed the current target. */
  reached: WeightEntry | null;

  // maintain
  band: { low: number; high: number } | null;
  bandPosition: BandPosition | null;
  /** kg outside the range (0 when inside). */
  bandDistance: number | null;
  /** Weigh-ins inside the range over the last 30 days. */
  inBand30: { inBand: number; total: number } | null;

  /**
   * Early warning while maintaining: the 7-day average is close to an edge of
   * the range, or the last two weeks' rate would carry it past one soon.
   * `date` is when, at that rate; null when it is only close.
   */
  drift: { edge: 'low' | 'high'; limit: number; gap: number; rate: number | null; date: string | null } | null;

  /** How long the weight has stayed past a passed target. */
  stay: { threshold: number; side: 'below' | 'above'; since: string; days: number } | null;
}

const r1 = (n: number) => roundWeight(n);

const ALL_SCOPE: Status['scope'] = {
  kind: 'all',
  key: 'all',
  closed: false,
  from: null,
  to: null,
  good: 'down',
  hasCurrentGoal: false,
};

function emptyStatus(goal: Goal | null, scope: Status['scope'] = ALL_SCOPE): Status {
  return {
    phase: 'empty',
    scope,
    latest: null,
    first: null,
    sinceStart: null,
    avg7: null,
    avg7Count: 0,
    avg7Prev: null,
    avg7Delta: null,
    week: null,
    month: null,
    trend: null,
    rate: null,
    rateSince: null,
    pace: null,
    goal,
    closed: null,
    toGo: null,
    projection: null,
    drift: null,
    journeyStart: null,
    progress: null,
    reached: null,
    band: null,
    bandPosition: null,
    bandDistance: null,
    inBand30: null,
    stay: null,
  };
}

/** Days of its own a scope needs before its pace is projected to a date or judged against a target pace. */
const PROJECTION_MIN_DAYS = 14;

export function buildStatus(
  entries: WeightEntry[],
  goals: Goal[],
  today: string = todayISO(),
  scopeKey: ScopeKey = 'current',
): Status {
  if (entries.length === 0) return emptyStatus(currentGoal(goals));

  const sc = resolveScope(scopeKey, goals, entries, today);
  const scope: Status['scope'] = {
    kind: sc.kind,
    key: sc.key,
    closed: sc.closed,
    from: sc.from,
    to: sc.to,
    good: sc.good,
    hasCurrentGoal: sc.hasCurrentGoal,
  };
  const goal = sc.goal;
  const pts = sc.entries;
  // A goal with no weigh-in to start from (nothing on or before it, nothing in it).
  if (pts.length === 0 || !sc.baseline) return { ...emptyStatus(goal, scope), phase: 'none' };
  // Nor has an earlier goal with no weigh-in inside its dates: the one before
  // it is not its "final weigh-in".
  if (sc.closed && sc.from && pts[pts.length - 1].date < sc.from) {
    return { ...emptyStatus(goal, scope), phase: 'none' };
  }

  const latest = pts[pts.length - 1];
  const first = sc.baseline;
  const end = latest.date;

  const cur = windowAverage(pts, end, MA_WINDOW);
  const prev = windowAverage(pts, addDaysISO(end, -MA_WINDOW), MA_WINDOW);
  const avg7 = cur.average == null ? null : r1(cur.average);
  const avg7Prev = prev.average == null ? null : r1(prev.average);
  const avg7Delta = avg7 != null && avg7Prev != null ? r1(avg7 - avg7Prev) : null;

  const rate = rateOverWindow(pts, end, RATE_WINDOW);

  // Calendar periods are levels of the whole history; a past goal has no "this week".
  const compare = (start: string, prevStart: string): PeriodCompare => {
    const now = averageBetween(entries, start, today);
    const before = averageBetween(entries, prevStart, addDaysISO(start, -1));
    const avg = now.average == null ? null : r1(now.average);
    const prevAvg = before.average == null ? null : r1(before.average);
    return {
      start,
      avg,
      count: now.count,
      prevAvg,
      prevCount: before.count,
      delta: avg != null && prevAvg != null ? r1(avg - prevAvg) : null,
      good: changeDirection(sc, goals, prevStart, today),
    };
  };
  const weekStart = weekStartISO(today);
  const monthStart = monthStartISO(today);
  const week = sc.closed ? null : compare(weekStart, addDaysISO(weekStart, -7));
  const month = sc.closed ? null : compare(monthStart, prevMonthStartISO(today));

  let trend: DeltaDirection | null = null;
  if (avg7Delta != null) {
    trend = avg7Delta < -TREND_BAND ? 'down' : avg7Delta > TREND_BAND ? 'up' : 'flat';
  } else if (rate != null) {
    trend = rate < -TREND_BAND ? 'down' : rate > TREND_BAND ? 'up' : 'flat';
  }

  const spanDays = daysBetween(first.date, end);
  const s: Status = {
    ...emptyStatus(goal, scope),
    phase: 'none',
    latest,
    first,
    sinceStart: pts.length > 1 ? r1(latest.weight - first.weight) : null,
    avg7,
    avg7Count: cur.count,
    avg7Prev,
    avg7Delta,
    week,
    month,
    trend,
    rate,
    rateSince: sc.kind !== 'all' && spanDays < RATE_WINDOW ? first.date : null,
  };

  if (!goal) return s;

  if (sc.closed && sc.from && sc.to) {
    s.closed = {
      days: daysBetween(sc.from, sc.to),
      avgRate: spanDays >= 7 ? (latest.weight - first.weight) / (spanDays / 7) : null,
      short: null,
    };
  }

  if (isTargetGoal(goal)) {
    const loss = goal.mode === 'lose';
    const reached = goalReachedOn(goal, pts);
    if (goal.rate != null && goal.rate > 0 && !sc.closed && !reached) {
      // The verdict waits for two weeks of the goal's own weigh-ins, like the
      // arrival date: the first days after a change of direction are mostly water.
      s.pace = {
        target: loss ? -goal.rate : goal.rate,
        state: rate == null || spanDays < PROJECTION_MIN_DAYS ? null : paceState(goal, rate),
      };
    }
    s.reached = reached;
    s.phase = reached ? 'reached' : 'reach';
    const remaining = loss ? latest.weight - goal.target : goal.target - latest.weight;
    s.toGo = r1(Math.max(0, remaining));
    // Passed once and then drifted back still ended short of the target.
    if (s.closed && remaining > 0) s.closed.short = s.toGo;

    // Progress is measured from where the scope starts: goals in a row that
    // share a direction are one scope, so a long loss still starts at its top.
    s.journeyStart = first;
    const span = Math.abs(first.weight - goal.target);
    if (span > 0) {
      const done = Math.abs(first.weight - latest.weight);
      const sameSide = loss ? latest.weight <= first.weight : latest.weight >= first.weight;
      s.progress = Math.max(0, Math.min(100, sameSide ? (done / span) * 100 : 0));
    }

    // A date needs two weeks of the goal's own weigh-ins: the first days after
    // a change of direction are mostly water and would promise far too much.
    const headingRight = rate != null && remaining > 0 && (loss ? rate < -0.01 : rate > 0.01);
    if (!sc.closed && !reached && headingRight && rate != null && spanDays >= PROJECTION_MIN_DAYS) {
      // The rate's own uncertainty gives the range: faster and slower ends.
      const fit = rateWithError(pts, end, RATE_WINDOW);
      const se = fit?.se ?? 0;
      const speed = Math.abs(rate);
      const fast = speed + PROJECTION_Z * se;
      const slow = speed - PROJECTION_Z * se;
      const at = (kgPerWeek: number) => {
        const weeks = remaining / kgPerWeek;
        return weeks < MAX_PROJECTION_WEEKS ? addDaysISO(end, Math.round(weeks * 7)) : null;
      };
      const early = at(fast);
      if (early) s.projection = { early, late: slow > 0.01 ? at(slow) : null };
    }
    if (reached && !sc.closed) {
      const side = loss ? 'below' : 'above';
      const st = staySince(pts, goal.target, side);
      if (st) s.stay = { threshold: goal.target, side, ...st };
    }
    return s;
  }

  // maintain
  s.phase = 'maintain';
  s.band = { low: goal.low, high: goal.high };
  const w = latest.weight;
  s.bandPosition = w < goal.low ? 'below' : w > goal.high ? 'above' : 'inside';
  s.bandDistance =
    s.bandPosition === 'below' ? r1(goal.low - w) : s.bandPosition === 'above' ? r1(w - goal.high) : 0;
  s.inBand30 = countInBand(pts, end, 30, goal.low, goal.high);
  if (sc.closed) return s;

  // Early warning: judged on the 7-day average and the last two weeks, so a
  // single heavy day does not raise it.
  if (avg7 != null && avg7 >= goal.low && avg7 <= goal.high) {
    const r = rateOverWindow(pts, end, DRIFT_WINDOW);
    const gapHigh = r1(goal.high - avg7);
    const gapLow = r1(avg7 - goal.low);
    const edge: 'low' | 'high' | null =
      r != null && r > 0.05 ? 'high' : r != null && r < -0.05 ? 'low' : null;
    if (edge) {
      const gap = edge === 'high' ? gapHigh : gapLow;
      const days = Math.round((gap / Math.abs(r!)) * 7);
      if (days <= DRIFT_DAYS) {
        s.drift = {
          edge,
          limit: edge === 'high' ? goal.high : goal.low,
          gap,
          rate: r,
          date: addDaysISO(end, Math.max(days, 1)),
        };
      }
    }
    if (!s.drift && Math.min(gapHigh, gapLow) <= DRIFT_NEAR) {
      const near = gapHigh <= gapLow ? 'high' : 'low';
      s.drift = {
        edge: near,
        limit: near === 'high' ? goal.high : goal.low,
        gap: Math.min(gapHigh, gapLow),
        rate: r,
        date: null,
      };
    }
  }

  // How long the weight has stayed past the target it passed before settling
  // into the range. Only a target on the range's far side says anything here:
  // after a cut to 75, maintaining 76–78 is not about staying under 75.
  const history = entries.filter((e) => e.date <= sc.asOf);
  const passed = lastReachedTarget(goals, history);
  const fits =
    passed != null &&
    (passed.goal.mode === 'gain' ? passed.goal.target <= goal.low : passed.goal.target >= goal.high);
  if (passed && fits) {
    const side = passed.goal.mode === 'gain' ? 'above' : 'below';
    const st = staySince(history, passed.goal.target, side);
    if (st) s.stay = { threshold: passed.goal.target, side, ...st };
    s.reached = passed.reached;
  } else if (!passed) {
    // No target was ever passed: how long under the top of the range.
    const st = staySince(history, goal.high, 'below');
    if (st) s.stay = { threshold: goal.high, side: 'below', ...st };
  }
  return s;
}
