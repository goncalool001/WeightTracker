import { MA_WINDOW } from '@/lib/constants';
import type { LinearFit } from '@/types';

/**
 * Ordinary least-squares degree-1 fit, equivalent to NumPy's
 * `polyfit(x, y, 1)`. Returns `{ slope, intercept }` for `y = slope*x + b`.
 * Requires at least two points; throws otherwise (callers guard on length).
 */
export function linearFit(xs: number[], ys: number[]): LinearFit {
  const n = xs.length;
  if (n < 2 || ys.length !== n) {
    throw new Error('linearFit requires at least two matching x/y points');
  }
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    sxy += xs[i] * ys[i];
  }
  const denom = n * sxx - sx * sx;
  // Degenerate (all x identical) — fall back to a flat line at the mean.
  if (denom === 0) {
    return { slope: 0, intercept: sy / n };
  }
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

/** Evaluate a linear fit at each x. */
export function predict(fit: LinearFit, xs: number[]): number[] {
  return xs.map((x) => fit.slope * x + fit.intercept);
}

/**
 * Trailing simple moving average with `min_periods = 1` semantics: the first
 * points average over the partial window, matching pandas' default rolling.
 */
export function movingAverage(values: number[], window = MA_WINDOW): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    let sum = 0;
    for (let j = start; j <= i; j++) sum += values[j];
    out.push(sum / (i - start + 1));
  }
  return out;
}

/** Whole-day offsets from the first date — the x-axis for the daily trend. */
export function dayOffsets(isoDates: string[]): number[] {
  if (isoDates.length === 0) return [];
  const MS_PER_DAY = 86_400_000;
  const base = Date.parse(isoDates[0]);
  return isoDates.map((d) => Math.round((Date.parse(d) - base) / MS_PER_DAY));
}
