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

/** Round a raw tick step up to a "nice" number (1, 2, 2.5, 5 × 10ⁿ). */
function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow; // 1 ≤ norm < 10
  let factor: number;
  if (norm <= 1) factor = 1;
  else if (norm <= 2) factor = 2;
  else if (norm <= 2.5) factor = 2.5;
  else if (norm <= 5) factor = 5;
  else factor = 10;
  return factor * pow;
}

/**
 * Derive a clean y-axis from the padded range: bounds snapped to a "nice" round
 * step and an explicit `interval`, so every tick label is a consistent round
 * number (no stray values like 87.6 at the extremes). The min/max boundary
 * labels are meant to be hidden (`showMinLabel`/`showMaxLabel: false`) — the
 * rounded bounds simply provide the headroom for the top value chip.
 */
export function niceYAxis(
  values: number[],
  goal: number | null,
  topFactor = 1.6,
): { min: number; max: number; interval: number } {
  const { min: padMin, max: padMax } = paddedYRange(values, goal, topFactor);
  const span = Math.max(padMax - padMin, 1);
  const step = niceStep(span / 5);
  const min = Math.floor(padMin / step) * step;
  const max = Math.ceil(padMax / step) * step;
  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    interval: step,
  };
}
