import type { WeightEntry } from '@/types';

/** Round a weight to 1 decimal place (the app's storage precision). */
export function roundWeight(weight: number): number {
  return Math.round((weight + Number.EPSILON) * 10) / 10;
}

/** Normalise a list of entries: coerce, drop invalid, dedupe by date (last
 *  wins), and sort ascending. Mirrors the desktop loader's data hygiene. */
export function normalizeEntries(raw: WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, number>();
  for (const e of raw) {
    if (!e || typeof e.date !== 'string') continue;
    const weight = Number(e.weight);
    if (!e.date || Number.isNaN(weight)) continue;
    byDate.set(e.date, roundWeight(weight)); // last occurrence wins
  }
  return Array.from(byDate.entries())
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Insert or update a single measurement (upsert keyed on date), returning a new
 * sorted array and whether the action was an add or an update.
 */
export function upsertEntry(
  entries: WeightEntry[],
  date: string,
  weight: number,
): { entries: WeightEntry[]; action: 'added' | 'updated' } {
  const w = roundWeight(weight);
  const exists = entries.some((e) => e.date === date);
  const next = exists
    ? entries.map((e) => (e.date === date ? { date, weight: w } : e))
    : [...entries, { date, weight: w }];
  next.sort((a, b) => a.date.localeCompare(b.date));
  return { entries: next, action: exists ? 'updated' : 'added' };
}

/** Remove the entry for a given date, returning a new array. */
export function removeEntry(
  entries: WeightEntry[],
  date: string,
): WeightEntry[] {
  return entries.filter((e) => e.date !== date);
}
