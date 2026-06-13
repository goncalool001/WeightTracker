import { useMemo } from 'react';
import {
  buildInsights,
  buildMetrics,
  filterByRange,
  filterPeriodsByRange,
  goalProjection,
  periodAverages,
  weeklyAverages,
} from '@/domain';
import { useT } from '@/i18n';
import { useStore } from './useStore';
import type {
  GoalProjection,
  Granularity,
  Insight,
  Metrics,
  PeriodAverage,
  WeightEntry,
} from '@/types';

/**
 * Derived-state hooks. Each memoises on its inputs so heavy recomputation only
 * happens when the underlying data actually changes.
 */

/** Per-measurement entries filtered by the active range (daily chart + table). */
export function useFilteredEntries(): WeightEntry[] {
  const entries = useStore((s) => s.entries);
  const range = useStore((s) => s.range);
  return useMemo(() => filterByRange(entries, range), [entries, range]);
}

/** Active aggregation granularity (weekly/monthly). */
export function useGranularity(): Granularity {
  return useStore((s) => s.granularity);
}

/**
 * Numbered period averages (weekly or monthly) for the active granularity,
 * scoped to the active range. Numbering stays dataset-based.
 */
export function usePeriods(): PeriodAverage[] {
  const entries = useStore((s) => s.entries);
  const range = useStore((s) => s.range);
  const granularity = useStore((s) => s.granularity);
  return useMemo(() => {
    const all = periodAverages(entries, granularity);
    return filterPeriodsByRange(all, range, entries);
  }, [entries, range, granularity]);
}

/** Headline metrics over the *full* dataset (totals/latest are all-time). */
export function useMetrics(): Metrics {
  const entries = useStore((s) => s.entries);
  return useMemo(
    () => buildMetrics(entries, weeklyAverages(entries)),
    [entries],
  );
}

/** Goal projection over the full-dataset weekly trend (stable across ranges). */
export function useGoalProjection(): GoalProjection | null {
  const entries = useStore((s) => s.entries);
  const goal = useStore((s) => s.goalWeight);
  return useMemo(
    () => goalProjection(weeklyAverages(entries), goal),
    [entries, goal],
  );
}

/** Generated analytical insights (full dataset + goal), locale-aware. */
export function useInsights(): Insight[] {
  const entries = useStore((s) => s.entries);
  const goal = useStore((s) => s.goalWeight);
  const locale = useStore((s) => s.locale);
  const t = useT();
  return useMemo(
    () =>
      buildInsights({
        entries,
        goal,
        strings: t.insights,
        fmtDate: t.fmtDate,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, goal, locale],
  );
}
