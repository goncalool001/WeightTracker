import { useId, useRef } from 'react';
import { isTargetGoal, type Status } from '@/domain';
import { AlertTriangle } from 'lucide-react';
import { abs1, kg, signed } from '@/lib/format';
import { useT } from '@/i18n';
import { useElementWidth } from '@/hooks/useViewport';
import { routeHref } from '@/hooks/useRoute';
import { useStore } from '@/store/useStore';
import { trimKg } from './headline';
import { DayStrip } from './DayStrip';

interface Label {
  v: number;
  text: string;
  /** Lower number wins a collision. */
  priority: number;
  strong?: boolean;
}

/**
 * The scale ruler: the product's own element. A horizontal kilogram scale
 * with the maintenance band (or the target) on it, a needle at today's
 * weigh-in, a ring at the 7-day average, and the start and any passed goal as
 * ticks. Labels that would collide are dropped, lowest priority first.
 */
export function Ruler({ s }: { s: Status }) {
  const t = useT();
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const entries = useStore((st) => st.entries);
  if (!s.latest) return null;

  const latest = s.latest.weight;
  // For a lose or gain goal the start mark is where progress is measured from.
  const start = s.journeyStart?.weight ?? s.first?.weight ?? latest;
  const band = s.phase === 'maintain' ? s.band : null;
  const target = isTargetGoal(s.goal) ? s.goal.target : null;
  const passed = s.phase === 'maintain' && s.stay ? s.stay.threshold : null;

  const values = [latest, start, s.avg7, band?.low, band?.high, target, passed].filter(
    (v): v is number => v != null,
  );
  const lo = Math.floor(Math.min(...values) - 0.5);
  const hi = Math.ceil(Math.max(...values) + 0.5);
  // For a target the bar reads as a journey: start on the left, goal on the
  // right, so a loss goal runs the scale from high to low.
  const flip = target != null && target < start;
  const x = (v: number) => ((flip ? hi - v : v - lo) / (hi - lo)) * 100;

  // Labels under the track.
  const candidates: Label[] = [];
  if (band) {
    candidates.push({ v: band.low, text: trimKg(band.low), priority: 0, strong: true });
    candidates.push({ v: band.high, text: trimKg(band.high), priority: 0, strong: true });
  }
  if (target != null) candidates.push({ v: target, text: `${t.rGoal} ${trimKg(target)}`, priority: 0, strong: true });
  if (passed != null) candidates.push({ v: passed, text: trimKg(passed), priority: 2 });
  if (start !== latest) candidates.push({ v: start, text: `${t.rStart} ${kg(start)}`, priority: 1 });

  const placed: Array<Label & { left: number; w: number }> = [];
  const px = (v: number) => (x(v) / 100) * width;
  for (const c of [...candidates].sort((a, b) => a.priority - b.priority)) {
    const w = c.text.length * 7.5 + 10;
    const left = Math.min(Math.max(px(c.v) - w / 2, 0), Math.max(width - w, 0));
    const clash = placed.some((p) => left < p.left + p.w && p.left < left + w);
    if (!clash || width === 0) placed.push({ ...c, left, w });
  }

  let caption: string;
  if (s.phase === 'maintain' && band) {
    if (s.bandPosition === 'inside') {
      caption = t.rCapInside(kg(latest), trimKg(band.low), abs1(latest - band.low), abs1(band.high - latest));
    } else if (s.bandPosition === 'above') {
      caption = t.rCapAbove(kg(latest), abs1(s.bandDistance ?? 0));
    } else {
      caption = t.rCapBelow(kg(latest), abs1(s.bandDistance ?? 0));
    }
  } else if (s.phase === 'reach' && target != null) {
    caption = t.rCapReach((s.progress ?? 0).toFixed(0), kg(start), trimKg(target));
  } else if (s.phase === 'reached' && target != null && s.reached) {
    caption = t.rCapReached(trimKg(target), t.fmtShort(s.reached.date), kg(s.reached.weight));
  } else {
    caption = t.rCapNone;
  }

  const title = s.phase === 'maintain' ? t.rulerMaintain : s.phase === 'none' ? t.rulerNone : t.rulerReach;
  const aria = [
    `${t.rToday} ${kg(latest)} kg`,
    s.avg7 != null ? `${t.rAvg} ${kg(s.avg7)} kg` : null,
    band ? `${t.rBand} ${trimKg(band.low)}–${trimKg(band.high)} kg` : null,
    target != null ? `${t.rGoal} ${trimKg(target)} kg` : null,
    `${t.rStart} ${kg(start)} kg`,
  ]
    .filter(Boolean)
    .join('; ');

  const cta =
    s.phase === 'reached' ? t.setMaintain : s.phase === 'none' ? t.setGoal : null;

  return (
    <section aria-labelledby={titleId} className="panel flex min-w-0 flex-col p-4 sm:p-5">
      <h2 id={titleId} className="text-[15px] font-semibold text-text lg:text-sm">
        {title}
      </h2>

      <div ref={ref} role="img" aria-label={t.rulerAria(aria)} className="relative mt-6 h-[96px]">
        {/* track */}
        <div className="absolute inset-x-0 top-[30px] h-2 rounded-full bg-active" />
        {/* journey covered, for a reach goal */}
        {s.phase === 'reach' && (
          <div
            className="absolute top-[30px] h-2 rounded-full bg-accent"
            style={{ left: `${Math.min(x(latest), x(start))}%`, width: `${Math.abs(x(start) - x(latest))}%` }}
          />
        )}
        {/* maintenance band */}
        {band && (
          <div
            className="absolute top-[24px] h-5 rounded-[4px] border-x-2 border-accent bg-accent-soft"
            style={{ left: `${Math.min(x(band.low), x(band.high))}%`, width: `${Math.abs(x(band.high) - x(band.low))}%` }}
          />
        )}
        {/* target tick */}
        {target != null && (
          <div className="absolute top-[22px] h-6 w-0.5 -translate-x-1/2 bg-text" style={{ left: `${x(target)}%` }} />
        )}
        {/* passed goal and start ticks */}
        {[passed, start !== latest ? start : null].map((v, i) =>
          v == null ? null : (
            <div
              key={i}
              className="absolute top-[26px] h-4 w-px -translate-x-1/2 bg-muted"
              style={{ left: `${x(v)}%` }}
            />
          ),
        )}
        {/* 7-day average ring */}
        {s.avg7 != null && (
          <div
            className="absolute top-[28px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-accent bg-raised"
            style={{ left: `${x(s.avg7)}%` }}
          />
        )}
        {/* today's needle and value */}
        <div className="absolute top-[18px] h-[22px] w-0.5 -translate-x-1/2 bg-text" style={{ left: `${x(latest)}%` }} />
        <div
          className="num absolute top-0 -translate-x-1/2 text-[14px] font-medium text-text"
          style={{ left: `clamp(20px, ${x(latest)}%, calc(100% - 20px))` }}
        >
          {kg(latest)}
        </div>
        {/* labels under the track */}
        {placed.map((p) => (
          <div
            key={p.text}
            className={`num absolute top-[50px] text-center text-[13px] ${p.strong ? 'text-text' : 'text-muted'}`}
            style={{ left: p.left, width: p.w }}
          >
            {p.text}
          </div>
        ))}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3.5 w-0.5 bg-text" />
          {t.rToday} <span className="num text-text">{kg(latest)}</span>
        </li>
        {s.avg7 != null && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-accent" />
            {t.rAvg} <span className="num text-text">{kg(s.avg7)}</span>
          </li>
        )}
        {band && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-4 rounded-[3px] border-x-2 border-accent bg-accent-soft" />
            {t.rBand}{' '}
            <span className="num text-text">
              {trimKg(band.low)}–{trimKg(band.high)}
            </span>
          </li>
        )}
      </ul>

      <p className="mt-4 text-[15px] text-text lg:text-sm">{caption}</p>
      {s.drift && (
        // Early warning while maintaining: before the range is left, not after.
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-inner bg-pill-warn px-3 py-2.5 text-[15px] text-pill-warn-ink lg:text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {s.drift.date && s.drift.rate != null
              ? (s.drift.edge === 'high' ? t.driftUp : t.driftDown)(
                  trimKg(s.drift.limit),
                  t.fmtShort(s.drift.date),
                  signed(s.drift.rate, 2),
                )
              : t.driftNear(abs1(s.drift.gap), trimKg(s.drift.limit))}
          </span>
        </p>
      )}
      <DayStrip s={s} entries={entries} />
      {cta && (
        <a
          href={routeHref('goal')}
          className="mt-3 inline-flex h-11 w-fit items-center rounded-full border border-control px-4 text-sm font-medium text-text hover:bg-active lg:h-9"
        >
          {cta}
        </a>
      )}
    </section>
  );
}
