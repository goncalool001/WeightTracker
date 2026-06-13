import { parseISO, subDays } from 'date-fns';
import type { RangeKey, WeightEntry } from '@/types';

/**
 * Filter entries by a time range, anchored on the most recent entry (not on
 * "today") so the view is meaningful even for back-dated datasets.
 *
 * - `7d` / `30d` / `90d`: entries within N days of the latest entry (inclusive).
 * - `ytd`: entries in the same calendar year as the latest entry.
 * - `all`: everything.
 *
 * Input is assumed sorted ascending; output preserves order.
 */
export function filterByRange(
  entries: WeightEntry[],
  range: RangeKey,
): WeightEntry[] {
  if (range === 'all' || entries.length === 0) return entries;

  const latest = parseISO(entries[entries.length - 1].date);

  if (range === 'ytd') {
    const year = latest.getFullYear();
    return entries.filter((e) => parseISO(e.date).getFullYear() === year);
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = subDays(latest, days - 1);
  return entries.filter((e) => parseISO(e.date) >= cutoff);
}
