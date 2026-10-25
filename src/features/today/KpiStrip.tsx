import type { ReactNode } from 'react';
import { isTargetGoal, type Status } from '@/domain';
import { abs1, kg } from '@/lib/format';
import { useT } from '@/i18n';
import { Delta } from '@/components/ui/Delta';
import { RATE_BAND } from '@/lib/constants';
import { trimKg } from './headline';

interface Tile {
  label: string;
  value: ReactNode;
  caption: ReactNode;
}

const Kg = ({ v }: { v: string }) => (
  <span className="num">
    {v}
    <span className="unit">kg</span>
  </span>
);

const dash = <span className="text-muted">{'—'}</span>;

/** "14–25 Nov" inside one month, "28 Nov – 3 Dec" across two. */
function dateRange(from: string, to: string, fmt: (iso: string) => string): string {
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${Number(from.slice(8))}–${fmt(to)}`
    : `${fmt(from)} – ${fmt(to)}`;
}

/**
 * Four figures that answer the next questions after the h1. Which four
 * depends on the phase: maintaining asks "how long under the old goal?",
 * reaching asks "how far, and when?".
 */
export function KpiStrip({ s }: { s: Status }) {
  const t = useT();

  const avg: Tile = {
    label: t.kAvg7,
    value: s.avg7 != null ? <Kg v={kg(s.avg7)} /> : dash,
    caption: s.avg7 != null ? t.kAvg7Cap(s.avg7Count) : t.kNoData,
  };
  const vsPrev: Tile = {
    label: t.kVsPrev,
    value: s.avg7Delta != null ? <Delta value={s.avg7Delta} unit="kg" band={0.05} /> : dash,
    caption: s.trend ? t.kVsPrevCap[s.trend] : t.kNoData,
  };
  const sinceStart: Tile = {
    label: t.kSinceStart,
    value: s.sinceStart != null ? <Delta value={s.sinceStart} /> : dash,
    caption: s.first ? t.kSinceStartCap(kg(s.first.weight), t.fmtShort(s.first.date)) : t.kNoData,
  };
  const rate =
    s.rate != null ? <Delta value={s.rate} unit={t.kPaceUnit} decimals={2} band={RATE_BAND} /> : null;
  const pace: Tile = {
    label: t.kPace,
    value: rate ?? dash,
    caption: s.rate == null ? t.kNoData : s.phase === 'reach' ? t.kPaceNoGoal : t.kPaceCap,
  };
  // When the goal is ahead and the pace leads there, the date is the answer;
  // the pace becomes its caption. The forecast is a range: one date only
  // when both ends agree, "after" when the slow end never arrives.
  const p = s.projection;
  const eta: Tile | null =
    p && rate
      ? {
          label: t.kEta,
          value: (
            <span className="num">
              {!p.late
                ? t.kEtaFrom(t.fmtShort(p.early))
                : p.late === p.early
                  ? t.fmtShort(p.early)
                  : dateRange(p.early, p.late, t.fmtShort)}
            </span>
          ),
          caption: p.late ? (
            <>
              <Delta value={s.rate} unit={t.kPaceUnit} decimals={2} band={RATE_BAND} /> {t.kEtaCap}
            </>
          ) : (
            t.kEtaUnsteady
          ),
        }
      : null;

  let tiles: Tile[];
  if (s.phase === 'maintain' || s.phase === 'reached') {
    // How long the weight has stayed past the target it passed: under it
    // after losing, over it after gaining.
    const g = s.goal;
    const side = s.stay?.side ?? (g?.mode === 'gain' ? 'above' : 'below');
    const threshold = s.stay?.threshold ?? (g ? (isTargetGoal(g) ? g.target : g.high) : 0);
    const label = side === 'above' ? t.kAbove(trimKg(threshold)) : t.kBelow(trimKg(threshold));
    const stay: Tile = s.stay
      ? {
          label,
          value: <span className="num">{t.kDays(s.stay.days)}</span>,
          caption: t.kSince(t.fmtShort(s.stay.since)),
        }
      : {
          label,
          value: dash,
          caption: side === 'above' ? t.kNotAbove(trimKg(threshold)) : t.kNotBelow(trimKg(threshold)),
        };
    tiles = [avg, vsPrev, stay, sinceStart];
  } else if (s.phase === 'reach' && s.goal) {
    const toGo: Tile = {
      label: t.kToGo,
      value: s.toGo != null ? <Kg v={abs1(s.toGo)} /> : dash,
      caption: t.kToGoCap(trimKg(s.goal.target)),
    };
    tiles = [avg, vsPrev, toGo, eta ?? pace];
  } else {
    tiles = [avg, vsPrev, pace, sinceStart];
  }

  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="panel flex min-w-0 flex-col gap-1 p-4 lg:min-h-[128px]">
          <dt className="text-[14px] text-muted">{tile.label}</dt>
          <dd className="text-[22px] leading-tight text-text sm:text-[24px]">{tile.value}</dd>
          <dd className="mt-auto text-[13px] text-muted">{tile.caption}</dd>
        </div>
      ))}
    </dl>
  );
}
