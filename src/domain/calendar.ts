import { MA_MIN_COUNT, MA_WINDOW, RATE_WINDOW } from '@/lib/constants';
import { linearFit, linearFitWithError } from './trend';
import type { CalendarAveragePoint, CustomRange, WeightEntry } from '@/types';

/**
 * Calendar-day arithmetic on ISO dates. Every window here is a window of
 * calendar days, not of measurements: a day without a weigh-in is simply
 * absent, never filled in.
 */

const DAY_MS = 86_400_000;

/** Days since the epoch for an ISO date (UTC, so no DST drift). */
export function dayNumber(iso: string): number {
  return Math.round(Date.parse(iso) / DAY_MS);
}

/** ISO date for a day number. */
export function isoFromDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Shift an ISO date by `n` calendar days. */
export function addDaysISO(iso: string, n: number): string {
  return isoFromDay(dayNumber(iso) + n);
}

/** Calendar days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

/** Today's local calendar date as ISO (avoids the UTC shift of toISOString). */
export function todayISO(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Entries whose date falls in [endISO − days + 1, endISO]. */
export function entriesInWindow(
  entries: WeightEntry[],
  endISO: string,
  days: number,
): WeightEntry[] {
  const end = dayNumber(endISO);
  const start = end - days + 1;
  return entries.filter((e) => {
    const d = dayNumber(e.date);
    return d >= start && d <= end;
  });
}

/** Mean of the weigh-ins in a calendar window ending on `endISO`. */
export function windowAverage(
  entries: WeightEntry[],
  endISO: string,
  days: number = MA_WINDOW,
): { average: number | null; count: number } {
  const inside = entriesInWindow(entries, endISO, days);
  if (inside.length === 0) return { average: null, count: 0 };
  const sum = inside.reduce((s, e) => s + e.weight, 0);
  return { average: sum / inside.length, count: inside.length };
}

/**
 * The trailing 7-day calendar average for every day from the first to the
 * last entry. A day's value is the mean of the weigh-ins dated within the six
 * days before it and the day itself; it is `null` when that window holds fewer
 * than `minCount` weigh-ins (the chart bridges those days with a dashed line,
 * see `averageGaps`).
 */
export function rollingCalendarAverage(
  entries: WeightEntry[],
  days: number = MA_WINDOW,
  minCount: number = MA_MIN_COUNT,
): CalendarAveragePoint[] {
  if (entries.length === 0) return [];
  const first = dayNumber(entries[0].date);
  const last = dayNumber(entries[entries.length - 1].date);
  const byDay = entries.map((e) => ({ day: dayNumber(e.date), w: e.weight }));

  const out: CalendarAveragePoint[] = [];
  let lo = 0;
  let hi = 0;
  let sum = 0;
  for (let day = first; day <= last; day++) {
    while (hi < byDay.length && byDay[hi].day <= day) sum += byDay[hi++].w;
    while (lo < hi && byDay[lo].day < day - days + 1) sum -= byDay[lo++].w;
    const count = hi - lo;
    out.push({
      date: isoFromDay(day),
      average: count >= minCount ? sum / count : null,
      count,
    });
  }
  return out;
}

/**
 * Least-squares rate of change in kg per week over the last `days` calendar
 * days. Needs at least four weigh-ins spanning a week; otherwise `null`.
 */
export function rateOverWindow(
  entries: WeightEntry[],
  endISO: string,
  days: number = RATE_WINDOW,
): number | null {
  const inside = entriesInWindow(entries, endISO, days);
  if (inside.length < 4) return null;
  const xs = inside.map((e) => dayNumber(e.date));
  if (xs[xs.length - 1] - xs[0] < 7) return null;
  return linearFit(xs, inside.map((e) => e.weight)).slope * 7;
}

/**
 * How long the weight has stayed past `threshold` on one side: the first
 * weigh-in after the last one that was not, and the days from then to the
 * latest weigh-in. `null` when the latest weigh-in is not past it.
 * "Below" is strictly under; "above" is strictly over.
 */
export function staySince(
  entries: WeightEntry[],
  threshold: number,
  side: 'below' | 'above',
): { since: string; days: number } | null {
  if (entries.length === 0) return null;
  const past = (w: number) => (side === 'below' ? w < threshold : w > threshold);
  const latest = entries[entries.length - 1];
  if (!past(latest.weight)) return null;
  let i = entries.length - 1;
  while (i > 0 && past(entries[i - 1].weight)) i--;
  const since = entries[i].date;
  return { since, days: daysBetween(since, latest.date) };
}

/** `staySince` below a threshold. */
export function belowSince(entries: WeightEntry[], threshold: number) {
  return staySince(entries, threshold, 'below');
}

/** Weigh-ins inside [low, high] among those in the window ending on `endISO`. */
export function countInBand(
  entries: WeightEntry[],
  endISO: string,
  days: number,
  low: number,
  high: number,
): { inBand: number; total: number } {
  const inside = entriesInWindow(entries, endISO, days);
  return {
    inBand: inside.filter((e) => e.weight >= low && e.weight <= high).length,
    total: inside.length,
  };
}

/**
 * The runs of days without an average that lie between two days with one:
 * each gap as the last point before it and the first point after it. Gaps at
 * the very start or end of the series are not bridged.
 */
export function averageGaps(
  series: CalendarAveragePoint[],
): Array<{ from: { date: string; average: number }; to: { date: string; average: number } }> {
  const gaps: Array<{ from: { date: string; average: number }; to: { date: string; average: number } }> = [];
  let before: { date: string; average: number } | null = null;
  let inGap = false;
  for (const p of series) {
    if (p.average == null) {
      if (before) inGap = true;
      continue;
    }
    if (inGap && before) gaps.push({ from: before, to: { date: p.date, average: p.average } });
    before = { date: p.date, average: p.average };
    inGap = false;
  }
  return gaps;
}

/**
 * Rate of change in kg per week over the last `days`, with its standard
 * error (also kg/week). Same data rules as `rateOverWindow`.
 */
export function rateWithError(
  entries: WeightEntry[],
  endISO: string,
  days: number = RATE_WINDOW,
): { rate: number; se: number | null } | null {
  const inside = entriesInWindow(entries, endISO, days);
  if (inside.length < 4) return null;
  const xs = inside.map((e) => dayNumber(e.date));
  if (xs[xs.length - 1] - xs[0] < 7) return null;
  const fit = linearFitWithError(xs, inside.map((e) => e.weight));
  return { rate: fit.slope * 7, se: fit.slopeSE == null ? null : fit.slopeSE * 7 };
}

/**
 * Calendar days in a row, ending today or yesterday, that each have a
 * weigh-in. Yesterday still counts so the streak does not read 0 in the
 * morning before today's weigh-in.
 */
export function consecutiveDays(entries: WeightEntry[], today: string): number {
  const days = new Set(entries.map((e) => dayNumber(e.date)));
  let d = dayNumber(today);
  if (!days.has(d)) d -= 1;
  let n = 0;
  while (days.has(d)) {
    n++;
    d--;
  }
  return n;
}

/** The window of the same length that ends the day before `bounds` starts. */
export function previousBounds(bounds: CustomRange): CustomRange {
  const len = daysBetween(bounds.from, bounds.to) + 1;
  return { from: addDaysISO(bounds.from, -len), to: addDaysISO(bounds.from, -1) };
}

/**
 * Mean, lowest and highest weigh-in between two dates (inclusive), and the
 * change across the period: the 7-day average on its last day with one minus
 * on its first, or the last weigh-in minus the first when the averages are
 * missing. `change` is null with a single weigh-in.
 */
export function periodSummary(
  entries: WeightEntry[],
  bounds: CustomRange,
): { average: number; low: number; high: number; count: number; change: number | null } | null {
  const inside = entries.filter((e) => e.date >= bounds.from && e.date <= bounds.to);
  if (inside.length === 0) return null;
  const ws = inside.map((e) => e.weight);
  const avgs = rollingCalendarAverage(entries)
    .filter((p) => p.date >= bounds.from && p.date <= bounds.to && p.average != null)
    .map((p) => p.average as number);
  const change =
    avgs.length >= 2
      ? avgs[avgs.length - 1] - avgs[0]
      : ws.length >= 2
        ? ws[ws.length - 1] - ws[0]
        : null;
  return {
    average: ws.reduce((a, b) => a + b, 0) / ws.length,
    low: Math.min(...ws),
    high: Math.max(...ws),
    count: ws.length,
    change,
  };
}

/**
 * How each weekday sits against its own week: every weigh-in minus the mean
 * of the weigh-ins within three days either side (at least four of them).
 * Returns the mean offset and the number of samples per weekday, Sunday = 0.
 */
export function weekdayOffsets(entries: WeightEntry[]): Array<{ offset: number; n: number }> {
  const byDay = entries.map((e) => ({ day: dayNumber(e.date), w: e.weight }));
  const acc = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const x of byDay) {
    const near = byDay.filter((y) => Math.abs(y.day - x.day) <= 3);
    if (near.length < 4) continue;
    const mean = near.reduce((a, b) => a + b.w, 0) / near.length;
    const wd = new Date(x.day * 86_400_000).getUTCDay();
    acc[wd].sum += x.w - mean;
    acc[wd].n++;
  }
  return acc.map((a) => ({ offset: a.n ? a.sum / a.n : 0, n: a.n }));
}
