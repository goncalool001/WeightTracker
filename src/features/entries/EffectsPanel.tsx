import { useId, useMemo } from 'react';
import { categoryEffects, groupOf, type CategoryEffect, type LagEffect } from '@/domain';
import { abs1, signed } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useGoodDirection } from '@/store/selectors';

/**
 * What explains the swings: per category, how far the weigh-in after such a
 * day sits from the previous 7-day average, against weigh-ins with no
 * category. One diverging bar per category on a shared scale, its 80% range
 * as a whisker, the next two days as numbers, and the count. Categories with
 * fewer than 5 weigh-ins show their count only. See domain/effects.ts.
 */
export function EffectsPanel({ className }: { className?: string }) {
  const t = useT();
  const id = useId();
  const entries = useStore((s) => s.entries);
  const good = useGoodDirection();
  const report = useMemo(() => categoryEffects(entries), [entries]);

  // One scale for every bar: the widest range, at least ±1 kg.
  const scale = Math.max(
    1,
    ...report.rows.flatMap((r) => [Math.abs(r.low ?? 0), Math.abs(r.high ?? 0)]),
  );
  const pos = (v: number) => 50 + (v / scale) * 50;

  const tone = (r: CategoryEffect) =>
    r.effect == null || r.unclear
      ? 'neutral'
      : (good === 'up' ? r.effect > 0 : r.effect < 0)
        ? 'positive'
        : 'negative';

  const value = (r: CategoryEffect) => {
    if (r.effect == null) return <span className="text-muted">{t.effFew(r.n)}</span>;
    const tn = tone(r);
    return (
      <span className="num">
        <span className={tn === 'positive' ? 'text-positive' : tn === 'negative' ? 'text-negative' : 'text-muted'}>
          {signed(r.effect)}
          <span className="ml-[0.2em] text-[0.8em]">kg</span>
        </span>
        {(r.unclear || r.tier === 'indicative') && (
          <span className="ml-2 text-[13px] text-muted">{r.unclear ? t.effUnclear : t.effIndicative}</span>
        )}
      </span>
    );
  };

  const bar = (r: CategoryEffect) => {
    if (r.effect == null || r.low == null || r.high == null) return <div className="h-5" />;
    const tn = tone(r);
    const from = Math.min(pos(0), pos(r.effect));
    const width = Math.abs(pos(r.effect) - pos(0));
    return (
      <div
        role="img"
        aria-label={t.effAria(t.cat[r.id], signed(r.effect), signed(r.low), signed(r.high), r.n)}
        className="relative h-5"
      >
        <div className="absolute inset-y-0 left-1/2 w-px bg-text" />
        <div
          className={cn(
            'absolute top-1 h-3',
            tn === 'positive' ? 'bg-positive' : tn === 'negative' ? 'bg-negative' : 'bg-cell-off',
            r.tier === 'indicative' && 'opacity-60',
          )}
          style={{ left: `${from}%`, width: `${Math.max(width, 0.6)}%` }}
        />
        {/* the 80% range */}
        <div
          className="absolute top-[9px] h-0.5 bg-text"
          style={{ left: `${pos(r.low)}%`, width: `${pos(r.high) - pos(r.low)}%` }}
        />
        <div className="absolute top-1.5 h-2 w-0.5 -translate-x-1/2 bg-text" style={{ left: `${pos(r.low)}%` }} />
        <div className="absolute top-1.5 h-2 w-0.5 -translate-x-1/2 bg-text" style={{ left: `${pos(r.high)}%` }} />
      </div>
    );
  };

  const lagText = (l: LagEffect | null) => (l ? signed(l.effect) : '—');

  return (
    <section aria-labelledby={id} className={cn('panel flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <h2 id={id} className="flex min-h-9 items-center text-[15px] font-semibold text-text lg:text-sm">
        {t.effTitle}
      </h2>
      <p className="max-w-[72ch] text-[14px] text-muted lg:text-[13px]">{t.effSub}</p>

      {report.rows.length === 0 ? (
        <p className="mt-4 text-[15px] text-text lg:text-sm">{t.effEmpty}</p>
      ) : (
        <>
          <p className="mt-4 text-[17px] text-text">
            {report.finding && report.finding.effect != null
              ? t.effFinding(t.cat[report.finding.id], abs1(report.finding.effect), report.finding.n, report.finding.effect > 0)
              : t.effNoFinding}
          </p>
          {report.swings.total > 0 && (
            <p className="mt-1 text-[14px] text-muted lg:text-[13px]">
              {t.effExplained(report.swings.tagged, report.swings.total)}
            </p>
          )}

          {/* ≥640px: a table */}
          <table className="mt-4 hidden w-full text-[15px] sm:table lg:text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[13px] text-muted">
                <th scope="col" className="h-10 pr-4 font-normal">{t.categoriesLbl}</th>
                <th scope="col" className="h-10 w-[38%] pr-4 font-normal">
                  <span className="sr-only">{t.effOnDay}</span>
                </th>
                <th scope="col" className="h-10 pr-4 text-right font-normal">{t.effOnDay}</th>
                <th scope="col" className="h-10 pr-4 text-right font-normal">{t.effNext}</th>
                <th scope="col" className="h-10 pr-4 text-right font-normal">{t.effNext2}</th>
                <th scope="col" className="h-10 text-right font-normal">{t.colWeighIns}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.id} className="border-b border-rule last:border-b-0">
                  <td className="h-12 py-2 pr-4">
                    <span className="text-text">{t.cat[r.id]}</span>
                    <span className="block text-[13px] text-muted">{t.catGroup[groupOf(r.id)]}</span>
                  </td>
                  <td className="h-12 pr-4">{bar(r)}</td>
                  <td className="h-12 whitespace-nowrap pr-4 text-right">{value(r)}</td>
                  <td className="num h-12 pr-4 text-right text-muted">{lagText(r.next1)}</td>
                  <td className="num h-12 pr-4 text-right text-muted">{lagText(r.next2)}</td>
                  <td className="num h-12 text-right text-muted">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* <640px: three-line rows */}
          <ul className="mt-3 sm:hidden">
            {report.rows.map((r) => (
              <li key={r.id} className="border-b border-rule py-3 last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] text-text">{t.cat[r.id]}</span>
                  <span className="text-[15px]">{value(r)}</span>
                </div>
                <div className="mt-1.5">{bar(r)}</div>
                <p className="num mt-1 text-[13px] text-muted">
                  {r.effect != null
                    ? `${t.effNext} ${lagText(r.next1)} · ${t.effNext2} ${lagText(r.next2)} · ${t.effCount(r.n)}`
                    : t.catGroup[groupOf(r.id)]}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[13px] text-muted">{t.effMethod}</p>
        </>
      )}
    </section>
  );
}

