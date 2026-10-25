import { sequentialDeltas } from '@/domain';
import { cn } from '@/lib/cn';
import { formatDelta, formatWeight } from '@/lib/format';
import { useT } from '@/i18n';
import type { DeltaDirection, Granularity, PeriodAverage } from '@/types';

const deltaColor: Record<DeltaDirection, string> = {
  down: 'text-good',
  up: 'text-bad',
  flat: 'text-muted',
};

interface PeriodTableProps {
  periods: PeriodAverage[];
  granularity: Granularity;
}

/** Period-average table — newest first, with dataset-based numbering and
 *  period-over-period deltas. Works for both weekly and monthly granularity. */
export function PeriodTable({ periods, granularity }: PeriodTableProps) {
  const t = useT();
  const isMonthly = granularity === 'monthly';
  const unitCol = isMonthly ? t.monthCol : t.weekCol;
  const emptyMsg = isMonthly ? t.noMonthlyData : t.noWeeklyData;

  const deltas = sequentialDeltas(periods.map((p) => p.average));
  const rows = periods.map((p, i) => ({ ...p, ...deltas[i] })).reverse();

  if (rows.length === 0) {
    return <p className="p-4 text-sm text-muted">{emptyMsg}</p>;
  }

  return (
    <div className="scrollbar-thin max-h-[360px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 text-xs text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">{unitCol}</th>
            <th className="px-3 py-2 text-right font-semibold">{t.avgCol}</th>
            <th className="px-3 py-2 text-right font-semibold">{t.changeCol}</th>
            <th className="px-3 py-2 text-right font-semibold">{t.entriesLbl}</th>
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
                {isMonthly
                  ? r.label
                  : `${t.fmtDate(r.start)} – ${t.fmtDate(r.end)}`}
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
        {t.periodsShown(periods.length, isMonthly ? 'month' : 'week')}
      </p>
    </div>
  );
}
