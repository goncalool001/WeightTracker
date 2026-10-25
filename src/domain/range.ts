import { parseISO, subDays } from 'date-fns';
import { addDaysISO } from './calendar';
import type { CustomRange, RangeKey, WeightEntry } from '@/types';

/**
 * The inclusive [from, to] dates a range covers, anchored on the most recent
 * entry (not on "today") so the view is meaningful even for back-dated
 * datasets. `null` means everything.
 *
 * - `7d` / `30d` / `90d`: the N days up to the latest entry.
 * - `ytd`: the calendar year of the latest entry.
 * - `custom`: the chosen dates (swapped if given backwards).
 */
export function rangeBounds(
  entries: WeightEntry[],
  range: RangeKey,
  custom?: CustomRange | null,
): CustomRange | null {
  if (range === 'all' || entries.length === 0) return null;
  const latest = entries[entries.length - 1].date;
  if (range === 'custom') {
    if (!custom) return null;
    return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
  }
  if (range === 'ytd') return { from: `${latest.slice(0, 4)}-01-01`, to: latest };
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return { from: addDaysISO(latest, -(days - 1)), to: latest };
}

/** Entries inside the range. Input is assumed sorted; output keeps order. */
export function filterByRange(
  entries: WeightEntry[],
  range: RangeKey,
  custom?: CustomRange | null,
): WeightEntry[] {
  const b = rangeBounds(entries, range, custom);
  if (!b) return entries;
  return entries.filter((e) => e.date >= b.from && e.date <= b.to);
}

/** A sensible first custom range: the 30 days up to the latest entry. */
export function defaultCustomRange(entries: WeightEntry[]): CustomRange | null {
  if (entries.length === 0) return null;
  const to = entries[entries.length - 1].date;
  const from = subDays(parseISO(to), 29);
  const iso = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
  return { from: iso < entries[0].date ? entries[0].date : iso, to };
}
