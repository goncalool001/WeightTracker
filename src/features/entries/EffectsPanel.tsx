import { useId, useMemo } from 'react';
import { categoryEffects, groupOf, type CategoryEffect, type LagEffect } from '@/domain';
import { signed } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useGoodDirection } from '@/store/selectors';

/**
 * What explains the swings: per category, how far the weigh-in after such a
 * day sits from the previous 7-day average, against weigh-ins with no
 * category. A note is about the day before, so the tagged weigh-in is "the
 * next morning"; the two weigh-ins after it say how long the effect lasts.
 *
 * Categories with 5 or more weigh-ins get a row: a diverging bar on one shared
 * scale (lighter to the left, heavier to the right) with its 80% range, and
 * the three mornings as labelled numbers. Categories with fewer are listed on
 * one line at the end with their counts. See domain/effects.ts.
 */
export function EffectsPanel({ className }: { className?: string }) {
  const t = useT();
  const id = useId();
  const entries = useStore((s) => s.entries);
  const good = useGoodDirection();
  const report = useMemo(() => categoryEffects(entries), [entries]);
  const measured = report.rows.filter((r) => r.effect != null);
  const few = report.rows.filter((r) => r.effect == null);

  // One scale for every bar: the widest range, at least ±1 kg.
  const scale = Math.max(
    1,
    ...measured.flatMap((r) => [Math.abs(r.low ?? 0), Math.abs(r.high ?? 0)]),
  );
  const pos = (v: number) => 50 + (v / scale) * 50;

  const toneOf = (effect: number | null, unclear = false) =>
    effect == null || unclear || Math.abs(effect) < 0.05
      ? 'neutral'
      : (good === 'up' ? effect > 0 : effect < 0)
        ? 'positive'
        : 'negative';
  const toneClass = (tn: string) =>
    tn === 'positive' ? 'text-positive' : tn === 'negative' ? 'text-negative' : 'text-muted';

  const kgValue = (v: number | null, unclear = false, strong = false) =>
    v == null ? (
      <span className="text-muted">{'—'}</span>
    ) : (
      <span className={cn('num', strong ? toneClass(toneOf(v, unclear)) : 'text-text')}>
        {signed(v)}
        <span className="ml-[0.2em] text-[0.8em]">kg</span>
      </span>
    );

  const verdict = (r: CategoryEffect) =>
    r.unclear ? t.effUnclear : r.tier === 'indicative' ? t.effIndicative : null;

  const bar = (r: CategoryEffect) => {
    if (r.effect == null || r.low == null || r.high == null) return null;
    const tn = toneOf(r.effect, r.unclear);
    const from = Math.min(pos(0), pos(r.effect));
    const width = Math.abs(pos(r.effect) - pos(0));
    return (
      <div
        role="img"
        aria-label={t.effAria(t.cat[r.id], signed(r.effect), signed(r.low), signed(r.high), r.n)}
        className="relative h-5"
      >
        <div className="absolute inset-y-0 left-1/2 w-px bg-control" />
        <div
          className={cn(
            'absolute top-1 h-3 rounded-[2px]',
            tn === 'positive' ? 'bg-positive' : tn === 'negative' ? 'bg-negative' : 'bg-cell-off',
            r.tier === 'indicative' && 'opacity-60',
          )}
          style={{ left: `${from}%`, width: `${Math.max(width, 0.6)}%` }}
        />
        {/* the 80% range */}
        <div
          className="absolute top-[9px] h-0.5 bg-muted"
          style={{ left: `${pos(r.low)}%`, width: `${pos(r.high) - pos(r.low)}%` }}
        />
        <div className="absolute top-1.5 h-2 w-0.5 -translate-x-1/2 bg-muted" style={{ left: `${pos(r.low)}%` }} />
        <div className="absolute top-1.5 h-2 w-0.5 -translate-x-1/2 bg-muted" style={{ left: `${pos(r.high)}%` }} />
      </div>
    );
  };

  // The bar's scale, said once above the list.
  const scaleKey = (
    <div aria-hidden="true" className="flex justify-between text-[12px] text-muted">
      <span>← {t.effLighter}</span>
      <span className="num">0</span>
      <span>{t.effHeavier} →</span>
    </div>
  );

  const lag = (l: LagEffect | null) => kgValue(l ? l.effect : null);
  const lagLabels = [t.effOnDay, t.effNext, t.effNext2];

  return (
    <section aria-labelledby={id} className={cn('panel flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <h2 id={id} className="flex min-h-9 items-center text-[15px] font-semibold text-text lg:text-sm">
        {t.effTitle}
      </h2>

      {report.rows.length === 0 ? (
        <p className="mt-4 text-[15px] text-text lg:text-sm">{t.effEmpty}</p>
      ) : (
        <>
          {measured.length > 0 && (
            <>
              {/* ≥640px: a table */}
              <table className="mt-4 hidden w-full text-[15px] sm:table lg:text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[13px] text-muted">
                    <th scope="col" className="h-10 pr-4 font-normal">{t.categoriesLbl}</th>
                    <th scope="col" className="h-10 w-[30%] pr-6 align-bottom font-normal">
                      <span className="sr-only">{t.effLighter} / {t.effHeavier}</span>
                      <div className="pb-2">{scaleKey}</div>
                    </th>
                    {lagLabels.map((l) => (
                      <th key={l} scope="col" className="h-10 pr-4 text-right font-normal">
                        {l}
                      </th>
                    ))}
                    <th scope="col" className="h-10 text-right font-normal">
                      <span className="sr-only">{t.effReliability}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {measured.map((r) => (
                    <tr key={r.id} className="border-b border-rule last:border-b-0">
                      <td className="py-3 pr-4">
                        <span className="text-text">{t.cat[r.id]}</span>
                        <span className="block text-[13px] text-muted">{t.effCount(r.n)}</span>
                      </td>
                      <td className="pr-6">{bar(r)}</td>
                      <td className="whitespace-nowrap pr-4 text-right">{kgValue(r.effect, r.unclear, true)}</td>
                      <td className="whitespace-nowrap pr-4 text-right">{lag(r.next1)}</td>
                      <td className="whitespace-nowrap pr-4 text-right">{lag(r.next2)}</td>
                      <td className="whitespace-nowrap text-right text-[13px] text-muted">{verdict(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* <640px: one block per category */}
              <div className="mt-4 sm:hidden">
                {scaleKey}
                <ul>
                  {measured.map((r) => (
                    <li key={r.id} className="border-b border-rule py-3 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[15px] text-text">{t.cat[r.id]}</span>
                        <span className="shrink-0 text-[13px] text-muted">
                          {[verdict(r), t.effCount(r.n)].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <div className="mt-2">{bar(r)}</div>
                      <dl className="mt-2 grid grid-cols-3 gap-2">
                        {lagLabels.map((l, i) => (
                          <div key={l} className="flex min-w-0 flex-col">
                            <dt className="text-[12px] text-muted">{l}</dt>
                            <dd className="text-[15px]">
                              {i === 0 ? kgValue(r.effect, r.unclear, true) : lag(i === 1 ? r.next1 : r.next2)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {few.length > 0 && (
            <div className="mt-4 border-t border-rule pt-3">
              <h3 className="text-[13px] text-muted">{t.effFewTitle}</h3>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[14px] lg:text-[13px]">
                {few.map((r) => (
                  <li key={r.id} className="text-text" title={t.catGroup[groupOf(r.id)]}>
                    {t.cat[r.id]} <span className="num text-muted">{r.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </>
      )}
    </section>
  );
}
