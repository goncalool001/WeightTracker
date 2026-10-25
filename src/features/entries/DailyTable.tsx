import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { roundWeight } from '@/domain';
import { kg } from '@/lib/format';
import { useT } from '@/i18n';
import { Delta } from '@/components/ui/Delta';
import { Button } from '@/components/ui/Button';
import { deleteWeight } from '@/features/log/actions';
import { EditDialog } from './EditDialog';
import { noteText } from '@/features/notes/noteText';
import type { WeightEntry } from '@/types';

const PAGE = 30;

/**
 * Every weigh-in, newest first, with its change from the weigh-in before it.
 * A table from 640px; below that, two-line rows (date and weight on the first
 * line, weekday and change on the second) so nothing wraps inside a number.
 * Edit and delete are on every row; delete has an undo toast instead of a
 * confirmation.
 */
export function DailyTable({ entries }: { entries: WeightEntry[] }) {
  const t = useT();
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<WeightEntry | null>(null);

  const rows = useMemo(
    () =>
      entries
        .map((e, i) => ({ ...e, delta: i > 0 ? roundWeight(e.weight - entries[i - 1].weight) : null }))
        .reverse(),
    [entries],
  );
  const shown = rows.slice(0, limit);

  const actions = (r: WeightEntry, compact: boolean) => (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(r)}
        aria-label={`${t.edit} ${t.fmtDate(r.date)}`}
        className={compact ? 'w-11 px-0' : 'px-3'}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        {!compact && <span>{t.edit}</span>}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => deleteWeight(r.date, t)}
        aria-label={`${t.del} ${t.fmtDate(r.date)}`}
        className={compact ? 'w-11 px-0' : 'px-3'}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {!compact && <span>{t.del}</span>}
      </Button>
    </div>
  );

  return (
    <>
      {/* ≥640px: a real table */}
      <table className="hidden w-full text-[15px] sm:table lg:text-sm">
        <thead className="sticky top-0 z-[1] bg-surface">
          <tr className="border-b border-border text-left text-[13px] text-muted">
            <th scope="col" className="h-10 pr-4 font-normal">{t.colDate}</th>
            <th scope="col" className="h-10 pr-4 text-right font-normal">{t.colWeight}</th>
            <th scope="col" className="h-10 pr-4 text-right font-normal">{t.colChange}</th>
            <th scope="col" className="h-10 text-right font-normal">
              <span className="sr-only">{t.colActions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.date} className="border-b border-rule last:border-b-0">
              <td className="h-12 py-2 pr-4">
                <span className="num text-text">{t.fmtDate(r.date)}</span>
                <span className="ml-2 text-muted">{t.fmtWeekday(r.date)}</span>
                {(r.note || r.tags) && <span className="block text-[13px] text-muted">{noteText(r, t)}</span>}
              </td>
              <td className="num h-12 pr-4 text-right text-text">
                {kg(r.weight)}
                <span className="unit">kg</span>
              </td>
              <td className="h-12 pr-4 text-right">
                <Delta value={r.delta} />
              </td>
              <td className="h-12 w-[1%] whitespace-nowrap">{actions(r, false)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* <640px: two-line rows */}
      <ul className="sm:hidden">
        {shown.map((r) => (
          <li key={r.date} className="flex items-center gap-2 border-b border-rule py-2 last:border-b-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="num text-[15px] text-text">{t.fmtDate(r.date)}</span>
                <span className="num text-[16px] text-text">
                  {kg(r.weight)}
                  <span className="unit">kg</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="truncate text-muted">
                  {t.fmtWeekday(r.date)}
                  {(r.note || r.tags) && ` · ${noteText(r, t)}`}
                </span>
                <Delta value={r.delta} />
              </div>
            </div>
            {actions(r, true)}
          </li>
        ))}
      </ul>

      {rows.length > limit && (
        <Button variant="secondary" className="mt-4 self-start" onClick={() => setLimit((l) => l + PAGE)}>
          {t.showMore(Math.min(PAGE, rows.length - limit))}
        </Button>
      )}

      <EditDialog entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}
