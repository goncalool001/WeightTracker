import type { ReactNode } from 'react';
import { addDaysISO, todayISO, type PeriodCompare, type Status } from '@/domain';
import { kg } from '@/lib/format';
import { useT } from '@/i18n';
import { Delta } from '@/components/ui/Delta';
import { RATE_BAND } from '@/lib/constants';

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
 * Four figures for the Today screen: the last weigh-in, the total since what
 * Today covers started (the goal in force, an earlier goal, or everything),
 * this week against last week (calendar weeks, Monday first) and this month
 * against last month. Where the goal stands (arrival, days past it, pace)
 * lives under the ruler.
 */
export function KpiStrip({ s }: { s: Status }) {
  const t = useT();
  const closed = s.scope.closed;

  // Week on week and month on month: this period's average as the figure,
  // the change and the period before on the line under it. The change is
  // judged by the goal only when both periods lie under one direction.
  const compare = (label: string, c: PeriodCompare | null, none: string): Tile => ({
    label,
    value: c?.avg != null ? <Kg v={kg(c.avg)} /> : dash,
    caption:
      c?.avg == null ? (
        none
      ) : c.delta != null && c.prevAvg != null ? (
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <Delta value={c.delta} band={0.05} good={c.good} />
          <span className="num">{t.kVsPrevAvg(kg(c.prevAvg))}</span>
        </span>
      ) : null,
  });

  const today = todayISO();
  const lastDate = s.latest?.date;
  const last: Tile = {
    label: closed ? t.kFinal : t.kLast,
    value: s.latest ? <Kg v={kg(s.latest.weight)} /> : dash,
    caption: !lastDate
      ? t.kNoData
      : !closed && lastDate === today
        ? t.kLastToday(t.fmtShort(lastDate))
        : !closed && lastDate === addDaysISO(today, -1)
          ? t.kLastYesterday(t.fmtShort(lastDate))
          : t.fmtShort(lastDate),
  };

  // The change since the scope started, named by what happened only while
  // it points the scope's way.
  const good = s.scope.good;
  const total = s.sinceStart;
  const totalLabel =
    total == null || Math.abs(total) < 0.05 || good == null
      ? t.kTotalChange
      : total < 0
        ? good === 'down' ? t.kTotalLost : t.kTotalChange
        : good === 'up' ? t.kTotalGained : t.kTotalChange;
  const sinceStart: Tile = {
    label: totalLabel,
    value: total != null ? <Delta value={total} good={good} /> : dash,
    caption: s.first ? t.kSinceStartCap(kg(s.first.weight), t.fmtShort(s.first.date)) : t.kNoData,
  };

  let tiles: Tile[];
  if (closed && s.closed && s.scope.from && s.scope.to) {
    // An earlier goal has no "this week": how long it ran and how fast it went.
    const duration: Tile = {
      label: t.kDuration,
      value: <span className="num">{t.kDays(s.closed.days)}</span>,
      caption: t.hRange(t.fmtShort(s.scope.from), t.fmtShort(s.scope.to)),
    };
    const avgPace: Tile = {
      label: t.kAvgPace,
      value:
        s.closed.avgRate != null ? (
          <Delta value={s.closed.avgRate} unit={t.kPaceUnit} decimals={2} band={RATE_BAND} good={good} />
        ) : (
          dash
        ),
      caption: null,
    };
    tiles = [last, sinceStart, duration, avgPace];
  } else {
    // Phones: last weigh-in | total, then week on week | month on month.
    tiles = [last, sinceStart, compare(t.kWeek, s.week, t.kWeekNone), compare(t.kMonth, s.month, t.kMonthNone)];
  }

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
