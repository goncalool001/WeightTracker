import { sequentialDeltas } from '@/domain';
import { cn } from '@/lib/cn';
import { formatDate, formatDelta, formatWeight } from '@/lib/format';
import type { DeltaDirection, Granularity, PeriodAverage } from '@/types';

const deltaColor: Record<DeltaDirection, string> = {
  down: 'text-good',
  up: 'text-bad',
  flat: 'text-muted',
};

interface PeriodTableProps {
  /** Range-scoped period averages, ascending; numbers are dataset-based. */
  periods: PeriodAverage[];
  granularity: Granularity;
}

/** Period-average table — newest first, with dataset-based numbering and
 *  period-over-period deltas. Works for both weekly and monthly granularity. */
export function PeriodTable({ periods, granularity }: PeriodTableProps) {
  const unit = granularity === 'monthly' ? 'Month' : 'Week';
  const deltas = sequentialDeltas(periods.map((p) => p.average));
  const rows = periods.map((p, i) => ({ ...p, ...deltas[i] })).reverse();

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No {unit.toLowerCase()}ly data in this range.
      </p>
    );
  }

  return (
    <div className="scrollbar-thin max-h-[360px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 text-xs text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">{unit}</th>
            <th className="px-3 py-2 text-right font-semibold">Avg</th>
            <th className="px-3 py-2 text-right font-semibold">Change</th>
            <th className="px-3 py-2 text-right font-semibold">Entries</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.start}
              className="border-t border-border transition-colors hover:bg-surface-2"
            >
              <td className="px-3 py-2 text-left text-muted">{r.number}</td>
              <td className="px-3 py-2 text-left text-text">
                {granularity === 'monthly'
                  ? r.label
                  : `${formatDate(r.start)} – ${formatDate(r.end)}`}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-text">
                {formatWeight(r.average, 2)}
              </td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-medium tabular-nums',
                  deltaColor[r.direction],
                )}
              >
                {r.delta == null ? '—' : `${formatDelta(r.delta, 2)} kg`}
              </td>
              <td className="px-3 py-2 text-right text-muted">
                {r.measurements}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-right text-xs text-muted">
        {periods.length} {unit.toLowerCase()}
        {periods.length === 1 ? '' : 's'} shown
      </p>
    </div>
  );
}
