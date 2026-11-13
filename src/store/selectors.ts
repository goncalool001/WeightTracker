import { useCallback, useMemo } from 'react';
import {
  buildInsights,
  buildStatus,
  changeDirection,
  currentGoal,
  goodDirection,
  periodAverages,
  resolveScope,
  rollingCalendarAverage,
  scopeRangeBounds,
  todayISO,
  type Good,
  type Scope,
  type Status,
} from '@/domain';
import { useT } from '@/i18n';
import { useStore } from './useStore';
import type {
  CalendarAveragePoint,
  CustomRange,
  Granularity,
  Insight,
  PeriodAverage,
  ScopeKey,
  WeightEntry,
} from '@/types';

/**
 * Derived-state hooks. Each memoises on its inputs so heavy recomputation only
 * happens when the underlying data actually changes.
 */

/**
 * What Today covers (see domain/scope.ts): the goal in force since it was
 * set, an earlier goal, or the whole history. Its `entries` are the weigh-ins
 * every Today figure is computed from.
 */
export function useScope(): Scope {
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const key = useStore((s) => s.scope);
  const today = todayISO();
  return useMemo(() => resolveScope(key, goals, entries, today), [key, goals, entries, today]);
}

/** The screen's answer: phase, averages, goal distances, inside the scope. */
export function useStatus(scope?: ScopeKey): Status {
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const stored = useStore((s) => s.scope);
  const key = scope ?? stored;
  const today = todayISO();
  return useMemo(() => buildStatus(entries, goals, today, key), [entries, goals, today, key]);
}

/** The visible dates of the daily chart, or `null` for the whole scope. */
export function useRangeBounds(): CustomRange | null {
  const scope = useScope();
  const range = useStore((s) => s.range);
  const custom = useStore((s) => s.customRange);
  return useMemo(() => scopeRangeBounds(scope, range, custom), [scope, range, custom]);
}

/** Weigh-ins of the scope in the active range (daily chart). */
export function useFilteredEntries(): WeightEntry[] {
  const scope = useScope();
  const b = useRangeBounds();
  return useMemo(
    () => (b ? scope.entries.filter((e) => e.date >= b.from && e.date <= b.to) : scope.entries),
    [scope, b],
  );
}

/**
 * The 7-day calendar average for every day of the active range. It is computed
 * over the scope's weigh-ins first, so the first days of a range still average
 * the weigh-ins just before it, and a goal's line never carries the weigh-ins
 * of the goal before it.
 */
export function useCalendarSeries(): CalendarAveragePoint[] {
  const scope = useScope();
  const filtered = useFilteredEntries();
  return useMemo(() => {
    if (filtered.length === 0) return [];
    const from = filtered[0].date;
    const to = filtered[filtered.length - 1].date;
    return rollingCalendarAverage(scope.entries).filter((p) => p.date >= from && p.date <= to);
  }, [scope, filtered]);
}

/** Active aggregation granularity (weekly/monthly). */
export function useGranularity(): Granularity {
  return useStore((s) => s.granularity);
}

/**
 * Numbered period averages. `active`: the weeks or months that overlap what
 * the daily chart shows (the scope, narrowed by the range). `all`: the whole
 * history. Averages and numbers always come from the whole history, so a week
 * reads the same on Today and on Entries.
 */
export function usePeriods(range: 'active' | 'all' = 'active'): PeriodAverage[] {
  const entries = useStore((s) => s.entries);
  const granularity = useStore((s) => s.granularity);
  const scope = useScope();
  const bounds = useRangeBounds();
  return useMemo(() => {
    const all = periodAverages(entries, granularity);
    if (range === 'all') return all;
    const pts = scope.entries;
    const raw =
      bounds ?? (scope.kind === 'all' || pts.length === 0 ? null : { from: pts[0].date, to: pts[pts.length - 1].date });
    if (!raw) return all;
    // Only the weeks or months the goal itself touches: a weigh-in from the
    // week before, used as its starting point, does not bring that week along.
    const from = scope.kind !== 'all' && scope.from && raw.from < scope.from ? scope.from : raw.from;
    return all.filter((p) => p.end >= from && p.start <= raw.to);
  }, [entries, granularity, range, scope, bounds]);
}

/** Generated insights for the scope, locale-aware. */
export function useInsights(): Insight[] {
  const all = useStore((s) => s.entries);
  const scope = useScope();
  const t = useT();
  return useMemo(
    () =>
      buildInsights({
        entries: scope.entries,
        goal: scope.goal,
        good: scope.good,
        closed: scope.closed,
        allEntries: all,
        catLabel: (id) => t.cat[id],
        strings: t.insights,
        fmtDate: t.fmtShort,
      }),
    [all, scope, t],
  );
}

/**
 * Which way is progress in what Today shows: up for a goal to gain, down for
 * a goal to lose and for the whole history, neither (`null`) while
 * maintaining. Colours on changes follow it (green = towards the goal).
 */
export function useGoodDirection(): Good {
  return useScope().good;
}

/**
 * How a change between two dates is judged on Today: a loss is progress when
 * everything is shown; otherwise the goal in force over those dates decides,
 * and a change that crosses a change of direction gets no verdict.
 */
export function useChangeDirection(): (from: string, to: string) => Good {
  const goals = useStore((s) => s.goals);
  const kind = useScope().kind;
  return useCallback((from, to) => changeDirection({ kind }, goals, from, to), [goals, kind]);
}

/** The direction of the goal in force, whatever Today is showing. */
export function useCurrentGoalDirection(): 'down' | 'up' {
  const goals = useStore((s) => s.goals);
  return goodDirection(currentGoal(goals));
}
