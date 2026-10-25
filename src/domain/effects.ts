import { addDaysISO, dayNumber } from './calendar';
import { CATEGORY_IDS, cleanTags, type CategoryId } from './categories';
import type { WeightEntry } from '@/types';

/**
 * What each category is linked to on the scale.
 *
 * A category on a weigh-in describes the day before it (yesterday's night out
 * explains this morning's weight), so its effect is read on that weigh-in.
 *
 * - Deviation: a weigh-in minus the mean of the weigh-ins in the 7 calendar
 *   days before it (at least 3), so the overall trend does not count as an
 *   effect.
 * - Effect: mean deviation of the weigh-ins with the category, minus the mean
 *   deviation of the weigh-ins with no category. Also read 1 and 2 days later
 *   against the same baseline, to see whether it passes.
 * - Range: about 80% (±1.28 standard errors, Welch). A range that includes
 *   zero is "no clear effect".
 * - Reliability: fewer than 5 weigh-ins, too few to show; 5–9, indicative;
 *   10 or more, shown as is.
 * - A weigh-in with two categories counts for both.
 *
 * These are associations in one person's data, not causes.
 */

export const EFFECT_MIN = 5;
export const EFFECT_RELIABLE = 10;
const Z80 = 1.28;
const BASELINE_DAYS = 7;
const BASELINE_MIN = 3;
/** A rise counts as a swing worth explaining above this (kg). */
export const SWING_KG = 0.5;

export type EffectTier = 'few' | 'indicative' | 'reliable';

export interface LagEffect {
  effect: number;
  n: number;
}

export interface CategoryEffect {
  id: CategoryId;
  /** Weigh-ins with this category and a usable baseline. */
  n: number;
  tier: EffectTier;
  /** kg vs untagged weigh-ins, on the tagged weigh-in. Null when too few. */
  effect: number | null;
  low: number | null;
  high: number | null;
  /** The range includes zero. */
  unclear: boolean;
  /** Same comparison 1 and 2 days later; null when too few. */
  next1: LagEffect | null;
  next2: LagEffect | null;
}

export interface EffectsReport {
  /** Categories that have been used, most reliable and largest first. */
  rows: CategoryEffect[];
  /** Untagged weigh-ins with a baseline (the reference). */
  reference: number;
  /** Rises above SWING_KG from the previous weigh-in, and how many have a category. */
  swings: { total: number; tagged: number };
  /** The strongest reliable, clear effect, if any. */
  finding: CategoryEffect | null;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[], m: number) =>
  xs.length > 1 ? xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1) : 0;

/** Difference of means with a Welch standard error. */
function compare(a: number[], ref: number[]): { effect: number; se: number } {
  const ma = mean(a);
  const mr = mean(ref);
  return { effect: ma - mr, se: Math.sqrt(variance(a, ma) / a.length + variance(ref, mr) / ref.length) };
}

export function categoryEffects(entries: WeightEntry[]): EffectsReport {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const days = entries.map((e) => dayNumber(e.date));

  // Baseline for each weigh-in: mean of the weigh-ins in the 7 days before.
  const baseline = new Map<string, number>();
  let lo = 0;
  for (let i = 0; i < entries.length; i++) {
    while (lo < i && days[lo] < days[i] - BASELINE_DAYS) lo++;
    const before = entries.slice(lo, i);
    if (before.length >= BASELINE_MIN) baseline.set(entries[i].date, mean(before.map((e) => e.weight)));
  }

  const devAt = (date: string, base: number): number | null => {
    const e = byDate.get(date);
    return e ? e.weight - base : null;
  };

  const reference: number[] = [];
  const perTag = new Map<CategoryId, { d0: number[]; d1: number[]; d2: number[] }>();
  for (const e of entries) {
    const base = baseline.get(e.date);
    if (base == null) continue;
    const tags = cleanTags(e.tags);
    if (!tags) {
      reference.push(e.weight - base);
      continue;
    }
    for (const id of tags) {
      const acc = perTag.get(id) ?? { d0: [], d1: [], d2: [] };
      acc.d0.push(e.weight - base);
      const n1 = devAt(addDaysISO(e.date, 1), base);
      const n2 = devAt(addDaysISO(e.date, 2), base);
      if (n1 != null) acc.d1.push(n1);
      if (n2 != null) acc.d2.push(n2);
      perTag.set(id, acc);
    }
  }

  const canCompare = reference.length >= EFFECT_MIN;
  const lag = (xs: number[]): LagEffect | null =>
    canCompare && xs.length >= EFFECT_MIN ? { effect: compare(xs, reference).effect, n: xs.length } : null;

  const rows: CategoryEffect[] = [];
  for (const id of CATEGORY_IDS) {
    const acc = perTag.get(id);
    if (!acc) continue;
    const n = acc.d0.length;
    const tier: EffectTier = n < EFFECT_MIN ? 'few' : n < EFFECT_RELIABLE ? 'indicative' : 'reliable';
    if (tier === 'few' || !canCompare) {
      rows.push({ id, n, tier: 'few', effect: null, low: null, high: null, unclear: true, next1: null, next2: null });
      continue;
    }
    const { effect, se } = compare(acc.d0, reference);
    const low = effect - Z80 * se;
    const high = effect + Z80 * se;
    rows.push({
      id,
      n,
      tier,
      effect,
      low,
      high,
      unclear: low <= 0 && high >= 0,
      next1: lag(acc.d1),
      next2: lag(acc.d2),
    });
  }

  const rank = (r: CategoryEffect) => (r.effect == null ? -1 : r.tier === 'reliable' ? 2 : 1);
  rows.sort((a, b) => rank(b) - rank(a) || (b.effect ?? 0) - (a.effect ?? 0) || b.n - a.n);

  // Rises worth explaining: up more than SWING_KG from the previous weigh-in.
  let total = 0;
  let tagged = 0;
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].weight - entries[i - 1].weight > SWING_KG) {
      total++;
      if (cleanTags(entries[i].tags)) tagged++;
    }
  }

  const clear = rows.filter((r) => r.tier === 'reliable' && !r.unclear && r.effect != null);
  const finding = clear.sort((a, b) => Math.abs(b.effect!) - Math.abs(a.effect!))[0] ?? null;

  return { rows, reference: reference.length, swings: { total, tagged }, finding };
}
