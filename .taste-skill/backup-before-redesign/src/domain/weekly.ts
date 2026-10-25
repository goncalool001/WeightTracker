import { endOfWeek, parseISO, startOfWeek } from 'date-fns';
import type { WeeklyAverage, WeightEntry } from '@/types';

/** ISO `YYYY-MM-DD` for a Date, using the local calendar (no tz shift). */
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Round to 2 decimal places (matches the desktop app's weekly rounding). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Aggregate daily entries into Monday–Sunday weekly averages.
 *
 * Faithful port of the original pandas `to_period("W-SUN")` grouping:
 * weeks run Monday→Sunday, the average is rounded to 2 dp, and the result
 * is ordered ascending by week start.
 */
export function weeklyAverages(entries: WeightEntry[]): WeeklyAverage[] {
  if (entries.length === 0) return [];

  const buckets = new Map<
    string,
    { weekStart: string; weekEnd: string; sum: number; count: number }
  >();

  for (const entry of entries) {
    const date = parseISO(entry.date);
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    const key = toISO(start);

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.sum += entry.weight;
      bucket.count += 1;
    } else {
      buckets.set(key, {
        weekStart: key,
        weekEnd: toISO(end),
        sum: entry.weight,
        count: 1,
      });
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((b) => ({
      weekStart: b.weekStart,
      weekEnd: b.weekEnd,
      averageWeight: round2(b.sum / b.count),
      measurements: b.count,
    }));
}
