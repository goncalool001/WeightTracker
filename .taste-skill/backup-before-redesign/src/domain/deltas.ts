import { DELTA_BAND } from '@/lib/constants';
import type { DeltaDirection, DeltaResult } from '@/types';

/**
 * Classify a change relative to a dead-band. Below `-band` is a loss ("down",
 * the good direction for weight), above `+band` is a gain ("up"), otherwise
 * "flat". Mirrors the colour logic of the original `_delta_cell`.
 */
export function classifyDelta(
  delta: number | null,
  band: number = DELTA_BAND,
): DeltaDirection {
  if (delta === null || Number.isNaN(delta)) return 'flat';
  if (delta < -band) return 'down';
  if (delta > band) return 'up';
  return 'flat';
}

/**
 * Compute, for each value in order, its delta from the previous value and the
 * resulting direction. The first element has a `null` delta.
 */
export function sequentialDeltas(
  values: number[],
  band: number = DELTA_BAND,
): DeltaResult[] {
  return values.map((v, i) => {
    const delta = i === 0 ? null : v - values[i - 1];
    return { delta, direction: classifyDelta(delta, band) };
  });
}
