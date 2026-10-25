/**
 * Number formatting shared across the UI. One rule per metric: weights and
 * weight changes at 1 decimal, rates (kg/week) at 2. Signs use a true minus
 * so "−0.1" and "+0.1" line up in tabular figures.
 */

/** `76.5` → "76.5". */
export function kg(value: number): string {
  return value.toFixed(1);
}

/** A signed change: "+0.4", "−1.2", "0.0". */
export function signed(value: number, decimals = 1): string {
  const fixed = Math.abs(value).toFixed(decimals);
  if (Number(fixed) === 0) return (0).toFixed(decimals);
  return `${value > 0 ? '+' : '−'}${fixed}`;
}

/** An unsigned magnitude: "1.5". */
export function abs1(value: number): string {
  return Math.abs(value).toFixed(1);
}
