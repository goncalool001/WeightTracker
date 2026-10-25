import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { addDaysISO, consecutiveDays, goodDirection, roundWeight, todayISO, type Status } from '@/domain';
import { kg } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import { Delta } from '@/components/ui/Delta';
import type { WeightEntry } from '@/types';

/** Below this a day-to-day change is read as no change. */
const FLAT_KG = 0.05;

type Mark = 'good' | 'bad' | 'flat' | 'none';

interface Day {
  date: string;
  w: number | null;
  /** Change against the weigh-in before it (which may be older than 30 days). */
  delta: number | null;
  prevDate: string | null;
  mark: Mark;
}

/**
 * The last 30 calendar days, one cell each, ending on the latest weigh-in.
 * Each weigh-in is compared with the one before it: green when it moved
 * towards the goal, red when it moved away, grey when it did not move.
 * Maintaining, a weigh-in inside the range is green, and one outside is green
 * only while it is heading back. Days without a weigh-in stay empty; nothing
 * is filled in. Hover, focus or tap a cell for its change.
 */
export function DayStrip({ s, entries }: { s: Status; entries: WeightEntry[] }) {
  const t = useT();
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(29);

  // A tap elsewhere closes the tooltip on touch screens.
  useEffect(() => {
    if (active == null) return;
    const close = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [active]);

  if (!s.latest) return null;
  const band = s.phase === 'maintain' ? s.band : null;
  const hasGoal = s.phase !== 'none' && s.goal != null;
  const good = goodDirection(s.goal);
  const index = new Map(entries.map((e, i) => [e.date, i]));

  const days: Day[] = Array.from({ length: 30 }, (_, i) => {
    const date = addDaysISO(s.latest!.date, i - 29);
    const at = index.get(date);
    if (at == null) return { date, w: null, delta: null, prevDate: null, mark: 'none' };
    const w = entries[at].weight;
    const prev = at > 0 ? entries[at - 1] : null;
    const delta = prev ? roundWeight(w - prev.weight) : null;
    let mark: Mark = 'flat';
    if (band) {
      const dist = (v: number) => (v < band.low ? band.low - v : v > band.high ? v - band.high : 0);
      if (dist(w) === 0) mark = 'good';
      else if (prev) mark = dist(w) < dist(prev.weight) ? 'good' : 'bad';
      else mark = 'bad';
    } else if (delta != null && Math.abs(delta) >= FLAT_KG) {
      mark = (delta < 0 ? 'down' : 'up') === good ? 'good' : 'bad';
    }
    return { date, w, delta, prevDate: prev?.date ?? null, mark };
  });

  const weighed = days.filter((d) => d.w != null);
  const goodCount = weighed.filter((d) => d.mark === 'good').length;
  const summary = band
    ? t.stripInBand(
        weighed.filter((d) => d.w! >= band.low && d.w! <= band.high).length,
        weighed.length,
      )
    : hasGoal
      ? t.stripToward(goodCount, weighed.length)
      : t.stripLogged(weighed.length);
  // Days in a row with a weigh-in, ending today (or yesterday, before today's).
  const streak = consecutiveDays(entries, todayISO());
  const anyFlat = weighed.some((d) => d.mark === 'flat');

  const label = (d: Day) =>
    d.w == null
      ? `${t.fmtShort(d.date)}: ${t.sNone}`
      : d.delta == null
        ? `${t.fmtShort(d.date)}: ${kg(d.w)} kg`
        : t.stripTip(t.fmtShort(d.date), kg(d.w), `${d.delta > 0 ? '+' : d.delta < 0 ? '−' : '±'}${Math.abs(d.delta).toFixed(1)}`, t.fmtShort(d.prevDate!));

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -30 : e.key === 'End' ? 30 : 0;
    if (!step) {
      if (e.key === 'Escape') setActive(null);
      return;
    }
    e.preventDefault();
    const next = Math.min(29, Math.max(0, focusIdx + step));
    setFocusIdx(next);
    setActive(next);
    (listRef.current?.children[next]?.firstElementChild as HTMLElement | null)?.focus();
  };

  const tip = active != null ? days[active] : null;
  const legend: Array<{ cls: string; text: string }> = [
    { cls: 'bg-positive', text: band ? t.sInBandOrBack : hasGoal ? t.sToward : t.sDown },
    { cls: 'bg-negative', text: band ? t.sAway : hasGoal ? t.sAgainst : t.sUp },
    ...(anyFlat ? [{ cls: 'bg-cell-off', text: t.sFlat }] : []),
    { cls: 'border border-control', text: t.sNone },
  ];

  return (
    <div className="mt-5 border-t border-rule pt-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-[14px] font-medium text-text lg:text-[13px]">{t.stripTitle}</h3>
        <ul className="flex flex-wrap gap-x-3 text-[13px] text-muted">
          {legend.map((l) => (
            <li key={l.text} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-[2px]', l.cls)} />
              {l.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative">
        {tip && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[8px] border border-border bg-raised px-2.5 py-1.5 text-[13px] text-text"
            style={{ left: `clamp(96px, ${((active! + 0.5) / 30) * 100}%, calc(100% - 96px))` }}
          >
            <span className="num text-muted">{t.fmtShort(tip.date)}</span>{' '}
            {tip.w == null ? (
              <span className="text-muted">{t.sNone}</span>
            ) : (
              <>
                <span className="num font-medium">
                  {kg(tip.w)}
                  <span className="unit">kg</span>
                </span>
                {tip.delta != null && (
                  <>
                    {' '}
                    <Delta value={tip.delta} band={FLAT_KG - 0.001} />
                    <span className="text-muted"> {t.stripVs(t.fmtShort(tip.prevDate!))}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}
        <ol
          ref={listRef}
          aria-label={summary}
          className="flex gap-[3px]"
          onMouseLeave={() => setActive(null)}
          onKeyDown={onKey}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setActive(null);
          }}
        >
          {days.map((d, i) => (
            <li key={d.date} className="min-w-0 flex-1">
              <button
                type="button"
                tabIndex={i === focusIdx ? 0 : -1}
                aria-label={label(d)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => {
                  setFocusIdx(i);
                  setActive(i);
                }}
                onClick={() => setActive((a) => (a === i ? null : i))}
                className={cn(
                  'block h-10 w-full rounded-[3px] transition-opacity lg:h-8',
                  d.mark === 'none'
                    ? 'border border-control'
                    : d.mark === 'good'
                      ? 'bg-positive'
                      : d.mark === 'bad'
                        ? 'bg-negative'
                        : 'bg-cell-off',
                  active != null && active !== i && 'opacity-60',
                )}
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="num mt-1 flex justify-between text-[13px] text-muted">
        <span>{t.fmtShort(days[0].date)}</span>
        <span>{t.fmtShort(days[29].date)}</span>
      </div>
      <p className="mt-3 text-[15px] text-text lg:text-sm">
        {summary}
        {streak >= 2 && <> {t.streak(streak)}</>}
      </p>
    </div>
  );
}
