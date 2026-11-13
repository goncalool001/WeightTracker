import type { ReactNode } from 'react';
import { isTargetGoal, type Status } from '@/domain';
import { abs1, signed } from '@/lib/format';
import { cn } from '@/lib/cn';
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
 * arrive and the pace behind that date (the three stay in place while a new
 * goal has too few weigh-ins of its own, with a dash). Past the goal or
 * maintaining: how long the weight has stayed past the target it passed.
 * With no goal: the pace. An earlier goal has none: nothing in it moves.
 */
export function goalFacts(s: Status, t: T): Fact[] {
  if (s.scope.closed) return [];
  const good = s.scope.good;
  const pace: Fact = {
    label: t.kPace,
    value:
      s.rate != null ? (
        <Delta value={s.rate} unit={t.kPaceUnit} decimals={2} band={RATE_BAND} good={good} />
      ) : (
        dash
      ),
    // A young goal says since when; after four weeks it is the usual window.
    caption: s.rate == null ? t.kNoData : s.rateSince ? t.kSince(t.fmtShort(s.rateSince)) : t.kPaceCap,
  };
  // With a target pace: is it being kept, then the target itself. Quicker than
  // planned is a warning too (muscle lost on a cut, fat gained on a bulk).
  if (s.pace) {
    const st = s.pace.state;
    const waiting = pace.caption;
    pace.caption = (
      <>
        <span
          className={cn(
            'block',
            st === 'on' ? 'text-positive' : st ? 'text-pill-warn-ink' : undefined,
          )}
        >
          {st === 'on' ? t.kPaceOn : st === 'slow' ? t.kPaceSlow : st === 'fast' ? t.kPaceFast : waiting}
        </span>
        <span className="num block whitespace-normal">{t.kPaceTarget(signed(s.pace.target, 2))}</span>
      </>
    );
  }

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
    const against = s.rate != null && (s.goal.mode === 'lose' ? s.rate > 0.01 : s.rate < -0.01);
    if (!p) {
      return [left, { label: t.kEta, value: dash }, against && !s.pace ? { ...pace, caption: t.kAway } : pace];
    }
    // The forecast is a range: one date only when both ends agree, "after"
    // when the slow end never arrives.
    const eta: Fact = {
      label: t.kEta,
      value: (
        // A range across two months is long: it may break at the dash on phones.
        <span className="num whitespace-normal">
          {!p.late
            ? t.kEtaFrom(t.fmtShort(p.early))
            : p.late === p.early
              ? t.fmtShort(p.early)
              : dateRange(p.early, p.late, t.fmtShort)}
        </span>
      ),
    };
    return [left, eta, p.late || s.pace ? pace : { ...pace, caption: t.kUnsteady }];
  }

  if (s.phase === 'reached' || (s.phase === 'maintain' && s.stay)) {
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
