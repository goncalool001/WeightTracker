import { dayOffsets, linearFit } from './trend';
import type { Metrics, WeeklyAverage, WeightEntry } from '@/types';

/**
 * Build the headline metrics shown in the dashboard cards. A faithful port of
 * `_refresh_metrics` from the desktop app. Operates on the full dataset
 * (entries assumed sorted ascending by date).
 */
export function buildMetrics(
  entries: WeightEntry[],
  weekly: WeeklyAverage[],
): Metrics {
  const latest =
    entries.length > 0
      ? {
          weight: entries[entries.length - 1].weight,
          date: entries[entries.length - 1].date,
        }
      : null;

  const thisWeek =
    weekly.length > 0
      ? {
          average: weekly[weekly.length - 1].averageWeight,
          measurements: weekly[weekly.length - 1].measurements,
        }
      : null;

  const vsLastWeek =
    weekly.length >= 2
      ? {
          average: weekly[weekly.length - 1].averageWeight,
          delta:
            weekly[weekly.length - 1].averageWeight -
            weekly[weekly.length - 2].averageWeight,
        }
      : null;

  const sinceStart =
    weekly.length >= 2
      ? {
          firstAverage: weekly[0].averageWeight,
          currentAverage: weekly[weekly.length - 1].averageWeight,
          delta:
            weekly[weekly.length - 1].averageWeight - weekly[0].averageWeight,
        }
      : null;

  let ratePerWeek: number | null = null;
  if (entries.length >= 2) {
    const xs = dayOffsets(entries.map((e) => e.date));
    const ys = entries.map((e) => e.weight);
    ratePerWeek = linearFit(xs, ys).slope * 7;
  }

  return {
    totalEntries: entries.length,
    latest,
    thisWeek,
    vsLastWeek,
    sinceStart,
    ratePerWeek,
  };
}
