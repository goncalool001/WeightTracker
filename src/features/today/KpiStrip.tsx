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
  caption: string;
}

const Kg = ({ v }: { v: string }) => (
  <span className="num">
    {v}
    <span className="unit">kg</span>
  </span>
);

const dash = <span className="text-muted">{'—'}</span>;

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
  // The forecast is a range: one date only when both ends agree.
  const paceCaption = () => {
    const p = s.projection;
    if (!p) return s.rate != null ? t.kPaceNoEta : t.kNoData;
    if (!p.late) return t.kPaceFrom(t.fmtShort(p.early));
    if (p.late === p.early) return t.kPaceEta(t.fmtShort(p.early));
    return t.kPaceRange(t.fmtShort(p.early), t.fmtShort(p.late));
  };
  const pace: Tile = {
    label: t.kPace,
    value:
      s.rate != null ? <Delta value={s.rate} unit={t.kPaceUnit} decimals={2} band={RATE_BAND} /> : dash,
    caption: paceCaption(),
  };

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
    tiles = [avg, vsPrev, toGo, pace];
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
