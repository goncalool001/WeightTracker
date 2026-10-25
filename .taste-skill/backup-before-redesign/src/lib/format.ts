import { format, parseISO } from 'date-fns';

/** Formatting helpers shared across the UI. Pure, no side effects. */

/** `2026-06-13` → `13 Jun 2026`. */
export function formatDate(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy');
}

/** `2026-06-13` → `13 Jun 2026 (Saturday)`. */
export function formatDateLong(iso: string): string {
  return format(parseISO(iso), 'dd MMM yyyy (EEEE)');
}

/** `2026-06-13` → `13 Jun`. */
export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'dd MMM');
}

/** A weight value with unit, e.g. `81.6 kg`. */
export function formatWeight(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)} kg`;
}

/** A signed delta, e.g. `+0.30`, `-1.20`, `0.00`. */
export function formatDelta(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

/** A signed delta with unit, e.g. `-1.20 kg`. */
export function formatDeltaWeight(value: number, decimals = 2): string {
  return `${formatDelta(value, decimals)} kg`;
}
