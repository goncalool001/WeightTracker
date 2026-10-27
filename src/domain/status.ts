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
import {
  currentGoal,
  goalReachedOn,
  isTargetGoal,
  lastReachedTarget,
  weightOnOrBefore,
} from './goals';
import type { DeltaDirection, Goal, WeightEntry } from '@/types';

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
 */

export type Phase = 'empty' | 'none' | 'reach' | 'reached' | 'maintain';
export type BandPosition = 'below' | 'inside' | 'above';

export interface Status {
  phase: Phase;
  latest: WeightEntry | null;
  first: WeightEntry | null;
  /** Latest minus first weigh-in. */
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
   * averages rounded to 0.1, delta from the rounded values.
   */
  week: {
    start: string;
    avg: number | null;
    count: number;
    prevAvg: number | null;
    prevCount: number;
    delta: number | null;
  } | null;
  /** The same for this calendar month against the whole month before. */
  month: {
    start: string;
    avg: number | null;
    count: number;
    prevAvg: number | null;
    prevCount: number;
    delta: number | null;
  } | null;
  /** down / up / flat by the 0.2 kg band; null with too little data. */
  trend: DeltaDirection | null;
  /** kg per week over the last 28 days, or null. */
  rate: number | null;
  goal: Goal | null;

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
  /** Where the progress is measured from: the first weigh-in when it lies on
   *  the far side of the target, else the weight on the day the goal was set. */
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

function emptyStatus(goal: Goal | null): Status {
  return {
    phase: 'empty',
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
    goal,
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

export function buildStatus(entries: WeightEntry[], goals: Goal[], today: string = todayISO()): Status {
  const goal = currentGoal(goals);
  if (entries.length === 0) return emptyStatus(goal);

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const end = latest.date;

  const cur = windowAverage(entries, end, MA_WINDOW);
  const prev = windowAverage(entries, addDaysISO(end, -MA_WINDOW), MA_WINDOW);
  const avg7 = cur.average == null ? null : r1(cur.average);
  const avg7Prev = prev.average == null ? null : r1(prev.average);
  const avg7Delta = avg7 != null && avg7Prev != null ? r1(avg7 - avg7Prev) : null;

  const rate = rateOverWindow(entries, end, RATE_WINDOW);

  const start = weekStartISO(today);
  const wk = averageBetween(entries, start, today);
  const wkPrev = averageBetween(entries, addDaysISO(start, -7), addDaysISO(start, -1));
  const wkAvg = wk.average == null ? null : r1(wk.average);
  const wkPrevAvg = wkPrev.average == null ? null : r1(wkPrev.average);
  const week = {
    start,
    avg: wkAvg,
    count: wk.count,
    prevAvg: wkPrevAvg,
    prevCount: wkPrev.count,
    delta: wkAvg != null && wkPrevAvg != null ? r1(wkAvg - wkPrevAvg) : null,
  };
  const mStart = monthStartISO(today);
  const mo = averageBetween(entries, mStart, today);
  const moPrev = averageBetween(entries, prevMonthStartISO(today), addDaysISO(mStart, -1));
  const moAvg = mo.average == null ? null : r1(mo.average);
  const moPrevAvg = moPrev.average == null ? null : r1(moPrev.average);
  const month = {
    start: mStart,
    avg: moAvg,
    count: mo.count,
    prevAvg: moPrevAvg,
    prevCount: moPrev.count,
    delta: moAvg != null && moPrevAvg != null ? r1(moAvg - moPrevAvg) : null,
  };

  let trend: DeltaDirection | null = null;
  if (avg7Delta != null) {
    trend = avg7Delta < -TREND_BAND ? 'down' : avg7Delta > TREND_BAND ? 'up' : 'flat';
  } else if (rate != null) {
    trend = rate < -TREND_BAND ? 'down' : rate > TREND_BAND ? 'up' : 'flat';
  }

  const s: Status = {
    ...emptyStatus(goal),
    phase: 'none',
    latest,
    first,
    sinceStart: entries.length > 1 ? r1(latest.weight - first.weight) : null,
    avg7,
    avg7Count: cur.count,
    avg7Prev,
    avg7Delta,
    week,
    month,
    trend,
    rate,
  };

  if (!goal) return s;

  if (isTargetGoal(goal)) {
    const loss = goal.mode === 'lose';
    const reached = goalReachedOn(goal, entries);
    s.reached = reached;
    s.phase = reached ? 'reached' : 'reach';
    const remaining = loss ? latest.weight - goal.target : goal.target - latest.weight;
    s.toGo = r1(Math.max(0, remaining));

    // Measure progress from the first weigh-in when it lies on the far side of
    // the target (a long loss towards 75); otherwise from the goal's own start.
    const farSide = loss ? first.weight > goal.target : first.weight < goal.target;
    if (farSide) {
      s.journeyStart = first;
    } else {
      const w = weightOnOrBefore(entries, goal.setOn) ?? latest.weight;
      s.journeyStart = { date: goal.setOn, weight: w };
    }
    const span = Math.abs(s.journeyStart.weight - goal.target);
    if (span > 0) {
      const done = Math.abs(s.journeyStart.weight - latest.weight);
      const sameSide = loss ? latest.weight <= s.journeyStart.weight : latest.weight >= s.journeyStart.weight;
      s.progress = Math.max(0, Math.min(100, sameSide ? (done / span) * 100 : 0));
    }

    const headingRight = rate != null && remaining > 0 && (loss ? rate < -0.01 : rate > 0.01);
    if (!reached && headingRight && rate != null) {
      // The rate's own uncertainty gives the range: faster and slower ends.
      const fit = rateWithError(entries, end, RATE_WINDOW);
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
    if (reached) {
      const side = loss ? 'below' : 'above';
      const st = staySince(entries, goal.target, side);
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
  s.inBand30 = countInBand(entries, end, 30, goal.low, goal.high);

  // Early warning: judged on the 7-day average and the last two weeks, so a
  // single heavy day does not raise it.
  if (avg7 != null && avg7 >= goal.low && avg7 <= goal.high) {
    const r = rateOverWindow(entries, end, DRIFT_WINDOW);
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

  const passed = lastReachedTarget(goals, entries);
  const threshold = passed ? passed.goal.target : goal.high;
  const side = passed?.goal.mode === 'gain' ? 'above' : 'below';
  const st = staySince(entries, threshold, side);
  if (st) s.stay = { threshold, side, ...st };
  if (passed) s.reached = passed.reached;
  return s;
}
