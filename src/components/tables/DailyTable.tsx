import { Trash2 } from 'lucide-react';
import { sequentialDeltas } from '@/domain';
import { cn } from '@/lib/cn';
import { formatDelta, formatWeight } from '@/lib/format';
import { useT } from '@/i18n';
import type { DeltaDirection, WeightEntry } from '@/types';

const deltaColor: Record<DeltaDirection, string> = {
  down: 'text-good',
  up: 'text-bad',
  flat: 'text-muted',
};

interface DailyTableProps {
  entries: WeightEntry[];
  onDelete: (date: string) => void;
}

/** Daily log table — newest first, with day-over-day deltas and per-row delete. */
export function DailyTable({ entries, onDelete }: DailyTableProps) {
  const t = useT();
  const deltas = sequentialDeltas(entries.map((e) => e.weight));
  const rows = entries
    .map((e, i) => ({ ...e, ...deltas[i] }))
    .reverse();

  if (rows.length === 0) {
    return <p className="p-4 text-sm text-muted">{t.noEntriesInRange}</p>;
  }

  return (
    <div className="scrollbar-thin max-h-[340px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 text-xs text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">{t.dateCol}</th>
            <th className="px-3 py-2 text-right font-semibold">{t.weightCol}</th>
            <th className="px-3 py-2 text-right font-semibold">{t.changeCol}</th>
            <th className="w-10 px-2 py-2" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.date}
              className="group border-t border-border transition-colors hover:bg-surface-2"
            >
              <td className="px-3 py-2 text-left text-text">
                {t.fmtDateLong(r.date)}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-text">
                {formatWeight(r.weight)}
              </td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-medium tabular-nums',
                  deltaColor[r.direction],
                )}
              >
                {r.delta == null ? '—' : `${formatDelta(r.delta, 1)} kg`}
              </td>
              <td className="px-2 py-2 text-right">
                <button
                  onClick={() => onDelete(r.date)}
                  aria-label={`${t.deleteBtn} ${t.fmtDateLong(r.date)}`}
                  className="rounded p-1 text-muted opacity-0 transition-opacity
                             hover:text-bad focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
