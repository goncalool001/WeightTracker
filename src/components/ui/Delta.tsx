import { cn } from '@/lib/cn';
import { signed } from '@/lib/format';
import { DELTA_BAND } from '@/lib/constants';
import { useGoodDirection } from '@/store/selectors';

interface DeltaProps {
  value: number | null;
  /** Unit after the number; empty for none. */
  unit?: string;
  decimals?: number;
  band?: number;
  /**
   * The direction that counts as progress. Left out, it is the direction of
   * what Today is showing; `null` gives no verdict (grey, arrow and sign kept).
   */
  good?: 'down' | 'up' | null;
  className?: string;
}

/**
 * A signed change. A move towards the goal is green, away from it red (down
 * is the good direction unless the goal is to gain); inside the dead-band it
 * is grey with no arrow, and it is grey with its arrow when neither direction
 * is progress (maintaining, or a change across two goals). The sign and arrow
 * carry the meaning without colour; a missing value is a grey dash.
 */
export function Delta({ value, unit = 'kg', decimals = 1, band = DELTA_BAND, good, className }: DeltaProps) {
  const goalGood = useGoodDirection();
  const goodDir = good === undefined ? goalGood : good;
  if (value == null) {
    return <span className={cn('text-muted', className)}>{'—'}</span>;
  }
  const dir = value < -band ? 'down' : value > band ? 'up' : 'flat';
  return (
    <span
      className={cn(
        'num inline-flex items-baseline gap-1',
        dir === 'flat' || goodDir == null ? 'text-muted' : dir === goodDir ? 'text-positive' : 'text-negative',
        className,
      )}
    >
      {dir !== 'flat' && (
        <span aria-hidden="true" className="text-[max(11px,0.7em)]">
          {dir === 'down' ? '▼' : '▲'}
        </span>
      )}
      <span>
        {signed(value, decimals)}
        {unit && <span className="ml-[0.2em] text-[0.8em]">{unit}</span>}
      </span>
    </span>
  );
}
