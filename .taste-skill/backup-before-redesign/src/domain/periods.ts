import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import type {
  Granularity,
  PeriodAverage,
  RangeKey,
  WeightEntry,
} from '@/types';

/** ISO `YYYY-MM-DD` for a Date, using the local calendar (no tz shift). */
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

interface PeriodSpec {
  start: (d: Date) => Date;
  end: (d: Date) => Date;
  label: (start: Date, end: Date) => string;
}

const WEEKLY_SPEC: PeriodSpec = {
  start: (d) => startOfWeek(d, { weekStartsOn: 1 }),
  end: (d) => endOfWeek(d, { weekStartsOn: 1 }),
  label: (start, end) =>
    `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`,
};

const MONTHLY_SPEC: PeriodSpec = {
  start: (d) => startOfMonth(d),
  end: (d) => endOfMonth(d),
  label: (start) => format(start, 'MMM yyyy'),
};

/**
 * Aggregate entries into numbered period averages. Numbering is dataset-based:
 * the first recorded period is #1, ascending by start. Averages and counts use
 * *all* entries in the period (stable regardless of any later range filter).
 */
function aggregate(
  entries: WeightEntry[],
  spec: PeriodSpec,
): PeriodAverage[] {
  if (entries.length === 0) return [];

  const buckets = new Map<
    string,
    { start: string; end: string; label: string; sum: number; count: number }
  >();

  for (const entry of entries) {
    const date = parseISO(entry.date);
    const start = spec.start(date);
    const end = spec.end(date);
    const key = toISO(start);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.sum += entry.weight;
      bucket.count += 1;
    } else {
      buckets.set(key, {
        start: key,
        end: toISO(end),
        label: spec.label(start, end),
        sum: entry.weight,
        count: 1,
      });
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((b, i) => ({
      number: i + 1,
      start: b.start,
      end: b.end,
      label: b.label,
      average: round2(b.sum / b.count),
      measurements: b.count,
    }));
}

/** Numbered weekly (Mon–Sun) averages over the full dataset. */
export function weeklyPeriods(entries: WeightEntry[]): PeriodAverage[] {
  return aggregate(entries, WEEKLY_SPEC);
}

/** Numbered monthly averages over the full dataset. */
export function monthlyPeriods(entries: WeightEntry[]): PeriodAverage[] {
  return aggregate(entries, MONTHLY_SPEC);
}

/** Numbered period averages for the requested granularity. */
export function periodAverages(
  entries: WeightEntry[],
  granularity: Granularity,
): PeriodAverage[] {
  return granularity === 'monthly'
    ? monthlyPeriods(entries)
    : weeklyPeriods(entries);
}

/**
 * Filter already-numbered periods down to those overlapping the active range,
 * anchored on the latest entry. Numbers are preserved (dataset-based), so a
 * filtered view still shows e.g. "Week #7".
 */
export function filterPeriodsByRange(
  periods: PeriodAverage[],
  range: RangeKey,
  entries: WeightEntry[],
): PeriodAverage[] {
  if (range === 'all' || periods.length === 0 || entries.length === 0) {
    return periods;
  }
  const latest = parseISO(entries[entries.length - 1].date);

  if (range === 'ytd') {
    const year = latest.getFullYear();
    return periods.filter((p) => parseISO(p.start).getFullYear() === year);
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = subDays(latest, days - 1);
  // Keep any period that overlaps the window (its end is on/after the cutoff).
  return periods.filter((p) => parseISO(p.end) >= cutoff);
}
