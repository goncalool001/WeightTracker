import type { ReactNode } from 'react';
import { addDaysISO, goodDirection, todayISO, type Status } from '@/domain';
import { kg } from '@/lib/format';
import { useT } from '@/i18n';
import { Delta } from '@/components/ui/Delta';

interface Tile {
  label: string;
  value: ReactNode;
  caption: ReactNode | null;
}

const Kg = ({ v }: { v: string }) => (
  <span className="num">
    {v}
    <span className="unit">kg</span>
  </span>
);

const dash = <span className="text-muted">{'—'}</span>;

/**
 * Four figures for the Today screen: this week against last week (calendar
 * weeks, Monday first), the last weigh-in, the total since the start, and
 * this month against last month. Where the goal stands (arrival, days past
 * it, pace) lives under the ruler.
 */
export function KpiStrip({ s }: { s: Status }) {
  const t = useT();
  const w = s.week;

  // Week on week and month on month: this period's average as the figure,
  // the change and the period before on the line under it.
  const compare = (label: string, c: Status['week'], none: string): Tile => ({
    label,
    value: c?.avg != null ? <Kg v={kg(c.avg)} /> : dash,
    caption:
      c?.avg == null ? (
        none
      ) : c.delta != null && c.prevAvg != null ? (
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <Delta value={c.delta} band={0.05} />
          <span className="num">{t.kVsPrevAvg(kg(c.prevAvg))}</span>
        </span>
      ) : null,
  });
  const week = compare(t.kWeek, w, t.kWeekNone);
  const month = compare(t.kMonth, s.month, t.kMonthNone);

  const today = todayISO();
  const lastDate = s.latest?.date;
  const last: Tile = {
    label: t.kLast,
    value: s.latest ? <Kg v={kg(s.latest.weight)} /> : dash,
    caption: !lastDate
      ? t.kNoData
      : lastDate === today
        ? t.kLastToday(t.fmtShort(lastDate))
        : lastDate === addDaysISO(today, -1)
          ? t.kLastYesterday(t.fmtShort(lastDate))
          : t.fmtShort(lastDate),
  };

  // Named by what happened, and only while it points the goal's way.
  const good = goodDirection(s.goal);
  const total = s.sinceStart;
  const totalLabel =
    total == null || Math.abs(total) < 0.05 || s.phase === 'maintain'
      ? t.kTotalChange
      : total < 0
        ? good === 'down' ? t.kTotalLost : t.kTotalChange
        : good === 'up' ? t.kTotalGained : t.kTotalChange;
  const sinceStart: Tile = {
    label: totalLabel,
    value: total != null ? <Delta value={total} /> : dash,
    caption: s.first ? t.kSinceStartCap(kg(s.first.weight), t.fmtShort(s.first.date)) : t.kNoData,
  };

  // Phones: last weigh-in | total, then week on week | month on month.
  const tiles = [last, sinceStart, week, month];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="panel flex min-w-0 flex-col gap-1 p-4 lg:min-h-[128px]">
          <dt className="text-[14px] text-muted">{tile.label}</dt>
          <dd className="text-[22px] leading-tight text-text sm:text-[24px]">{tile.value}</dd>
          {tile.caption != null && (
            <dd className="mt-auto text-[13px] text-muted">{tile.caption}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
