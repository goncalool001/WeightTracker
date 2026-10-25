/** Round a raw tick step up to a "nice" number (1, 2, 2.5, 5 × 10ⁿ). */
function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const factor = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return factor * pow;
}

/**
 * A tight y-axis for body weight: never anchored at zero, padded by a step
 * so no mark touches the plot edge, with 3–5 round ticks. Reference values
 * (a band, a target) are included so they are always on screen.
 */
export function niceYAxis(
  values: number[],
  refs: number[] = [],
  ticks = 4,
): { min: number; max: number; interval: number } {
  const all = [...values, ...refs];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const step = niceStep(Math.max(hi - lo, 1) / ticks);
  const min = Math.floor((lo - step * 0.25) / step) * step;
  const max = Math.ceil((hi + step * 0.25) / step) * step;
  return { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)), interval: step };
}

/** A symmetric axis around zero for signed changes. */
export function signedAxis(values: number[]): { min: number; max: number; interval: number } {
  const m = Math.max(0.5, ...values.map((v) => Math.abs(v)));
  const step = niceStep(m / 3);
  const lim = Math.ceil(m / step) * step;
  return { min: -lim, max: lim, interval: step };
}
