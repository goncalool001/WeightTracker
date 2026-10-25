import { useMemo } from 'react';
import {
  buildInsights,
  buildStatus,
  currentGoal,
  filterByRange,
  filterPeriodsByRange,
  goodDirection,
  periodAverages,
  rollingCalendarAverage,
  type Status,
} from '@/domain';
import { useT } from '@/i18n';
import { useStore } from './useStore';
import type { CalendarAveragePoint, Granularity, Insight, PeriodAverage, WeightEntry } from '@/types';

/**
 * Derived-state hooks. Each memoises on its inputs so heavy recomputation only
 * happens when the underlying data actually changes.
 */

/** The screen's answer: phase, averages, goal distances (full dataset). */
export function useStatus(): Status {
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  return useMemo(() => buildStatus(entries, goals), [entries, goals]);
}

/** Weigh-ins in the active range (daily chart). */
export function useFilteredEntries(): WeightEntry[] {
  const entries = useStore((s) => s.entries);
  const range = useStore((s) => s.range);
  const custom = useStore((s) => s.customRange);
  return useMemo(() => filterByRange(entries, range, custom), [entries, range, custom]);
}

/**
 * The 7-day calendar average for every day of the active range. It is computed
 * over the full history first, so the first days of a range still average the
 * weigh-ins just before it.
 */
export function useCalendarSeries(): CalendarAveragePoint[] {
  const entries = useStore((s) => s.entries);
  const filtered = useFilteredEntries();
  return useMemo(() => {
    if (filtered.length === 0) return [];
    const from = filtered[0].date;
    const to = filtered[filtered.length - 1].date;
    return rollingCalendarAverage(entries).filter((p) => p.date >= from && p.date <= to);
  }, [entries, filtered]);
}

/** Active aggregation granularity (weekly/monthly). */
export function useGranularity(): Granularity {
  return useStore((s) => s.granularity);
}

/** Numbered period averages for the active granularity and range. */
export function usePeriods(range: 'active' | 'all' = 'active'): PeriodAverage[] {
  const entries = useStore((s) => s.entries);
  const active = useStore((s) => s.range);
  const custom = useStore((s) => s.customRange);
  const granularity = useStore((s) => s.granularity);
  return useMemo(() => {
    const all = periodAverages(entries, granularity);
    return range === 'all' ? all : filterPeriodsByRange(all, active, entries, custom);
  }, [entries, active, custom, granularity, range]);
}

/** Generated analytical insights (full dataset + goal), locale-aware. */
export function useInsights(): Insight[] {
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const t = useT();
  return useMemo(
    () =>
      buildInsights({
        entries,
        goals,
        catLabel: (id) => t.cat[id],
        strings: t.insights,
        fmtDate: t.fmtShort,
      }),
    [entries, goals, t],
  );
}

/**
 * Which way is progress for the current goal: up for a gain goal, down for
 * everything else. Colours on changes follow it (green = towards the goal).
 */
export function useGoodDirection(): 'down' | 'up' {
  const goals = useStore((s) => s.goals);
  return goodDirection(currentGoal(goals));
}
