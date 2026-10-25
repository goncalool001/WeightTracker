import { kg } from '@/lib/format';

/** A band edge or target without a needless ".0": 76 → "76", 76.5 → "76.5". */
export function trimKg(n: number): string {
  return Number.isInteger(n) ? String(n) : kg(n);
}
