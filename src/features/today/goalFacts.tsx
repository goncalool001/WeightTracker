import type { ReactNode } from 'react';
import { isTargetGoal, type Status } from '@/domain';
import { abs1 } from '@/lib/format';
import type { T } from '@/i18n';
import { Delta } from '@/components/ui/Delta';
import { RATE_BAND } from '@/lib/constants';
import { trimKg } from './headline';

export interface Fact {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
}

const dash = <span className="text-muted">{'—'}</span>;

/** "14–25 Nov" inside one month, "28 Nov – 3 Dec" across two. */
function dateRange(from: string, to: string, fmt: (iso: string) => string): string {
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${Number(from.slice(8))}–${fmt(to)}`
    : `${fmt(from)} – ${fmt(to)}`;
}

/**
 * The figures under the goal ruler. On the way: what is left, when it should
 * arrive and the pace behind that date. Past the goal or maintaining: how long
 * the weight has stayed past the target it passed. With no goal: the pace.
 */
export function goalFacts(s: Status, t: T): Fact[] {
  const pace: Fact = {
    label: t.kPace,
    value: s.rate != null ? <Delta value={s.rate} unit={t.kPaceUnit} decimals={2} band={RATE_BAND} /> : dash,
    caption: s.rate == null ? t.kNoData : t.kPaceCap,
  };

  if (s.phase === 'reach' && s.goal) {
    const left: Fact = {
      label: t.kToGo,
      value: s.toGo != null ? (
        <span className="num">
          {abs1(s.toGo)}
          <span className="unit">kg</span>
        </span>
      ) : (
        dash
      ),
    };
    const p = s.projection;
    if (!p || s.rate == null) return [left, { ...pace, caption: s.rate != null ? t.kAway : t.kNoData }];
    // The forecast is a range: one date only when both ends agree, "after"
    // when the slow end never arrives.
    const eta: Fact = {
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
    };
    return [left, eta, p.late ? pace : { ...pace, caption: t.kUnsteady }];
  }

  if (s.phase === 'maintain' || s.phase === 'reached') {
    // How long the weight has stayed past the target it passed: under it
    // after losing, over it after gaining.
    const g = s.goal;
    const side = s.stay?.side ?? (g?.mode === 'gain' ? 'above' : 'below');
    const threshold = s.stay?.threshold ?? (g ? (isTargetGoal(g) ? g.target : g.high) : 0);
    const stay: Fact = {
      label: side === 'above' ? t.kAbove(trimKg(threshold)) : t.kBelow(trimKg(threshold)),
      value: s.stay ? <span className="num">{t.kDays(s.stay.days)}</span> : dash,
      caption: s.stay
        ? t.kSince(t.fmtShort(s.stay.since))
        : side === 'above'
          ? t.kNotAbove(trimKg(threshold))
          : t.kNotBelow(trimKg(threshold)),
    };
    return [stay, pace];
  }

  return [pace];
}
