/**
 * Compute a padded y-axis range: ~10% (min 1 kg) below the lowest value — never
 * anchored at zero — with extra headroom on top for value labels. Includes the
 * goal line when set. Faithful to the desktop app's `_padded_y_range`.
 */
export function paddedYRange(
  values: number[],
  goal: number | null,
  topFactor = 1.6,
): { min: number; max: number } {
  const all = goal != null ? [...values, goal] : [...values];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const spread = Math.max(hi - lo, 1);
  const pad = Math.max(spread * 0.1, 1);
  return { min: lo - pad, max: hi + pad * topFactor };
}
