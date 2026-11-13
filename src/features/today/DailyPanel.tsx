import { useId, useMemo, useState } from 'react';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import {
  useCalendarSeries,
  useChangeDirection,
  useFilteredEntries,
  useRangeBounds,
  useScope,
} from '@/store/selectors';
import { useCoarsePointer, useMedia } from '@/hooks/useViewport';
import {
  averageGaps,
  daysBetween,
  goalMarks,
  periodSummary,
  previousBounds,
  roundWeight,
  rollingCalendarAverage,
  todayISO,
} from '@/domain';
import { trimKg } from './headline';
import { kg } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Delta } from '@/components/ui/Delta';
import { DailyChart } from '@/components/charts/DailyChart';
import { ChartBoundary } from '@/components/states/ChartBoundary';
import { Segmented } from '@/components/ui/Segmented';
import type { Overlay, RangeKey } from '@/types';

const RANGES: RangeKey[] = ['7d', '30d', '90d', 'ytd', 'all', 'custom'];

/**
 * The main chart, in the screen's one white inner card. One row of controls
 * above it (the period); choosing "Dates" adds the two date fields under it.
 * The legend, the overlay choice and the comparison with the period before
 * sit underneath the chart.
 *
 * The chart shows what Today covers: the weigh-ins of the goal in force (or
 * of an earlier goal, or everything), narrowed by the period buttons. While
 * one goal is shown the widest button reads "Goal", since it is the whole of
 * that goal and not the whole history.
 */
export function DailyPanel() {
  const t = useT();
  const id = useId();
  const fromId = useId();
  const toId = useId();
  const goals = useStore((s) => s.goals);
  const range = useStore((s) => s.range);
  const scope = useScope();
  // Every weigh-in of what Today covers; the buttons narrow it.
  const all = scope.entries;
  const changeGood = useChangeDirection();
  const overlay = useStore((s) => s.overlay);
  const setRange = useStore((s) => s.setRange);
  const setCustomRange = useStore((s) => s.setCustomRange);
  const setOverlay = useStore((s) => s.setOverlay);
  const entries = useFilteredEntries();
  const series = useCalendarSeries();
  const coarse = useCoarsePointer();
  const narrow = !useMedia('(min-width: 640px)');
  const hasGaps = overlay === 'ma' && averageGaps(series).length > 0;
  const firstDate = all[0]?.date;
  const lastDate = all[all.length - 1]?.date;
  // The visible dates; `null` is the whole scope.
  const current = useRangeBounds();
  const bounds =
    range === 'custom' && firstDate && lastDate ? (current ?? { from: firstDate, to: lastDate }) : null;

  // Each goal over its own dates, clipped to what is visible.
  const marks = useMemo(() => {
    if (entries.length === 0) return [];
    const shown = scope.kind === 'all' ? goals : (scope.phase?.goals ?? []);
    // A goal set after the last weigh-in (nothing logged under it yet) still
    // shows its line: the visible dates reach the day it was set.
    const lastShown = entries[entries.length - 1].date;
    const start = scope.kind === 'current' ? scope.goal?.setOn : null;
    const to = start && start > lastShown && lastShown === lastDate ? start : lastShown;
    const found = goalMarks(shown, entries[0].date, to);
    // A goal with no span yet cannot be drawn beside others; when none has a
    // span, the goal in force is drawn across the plot.
    const spanned = found.filter((m) => m.from < m.to);
    return spanned.length > 0 ? spanned : found.filter((m) => m.goal.endedOn === null).slice(-1);
  }, [scope, goals, entries, lastDate]);
  // One legend entry per distinct target or range.
  const markLabels = [
    ...new Map(
      marks.map((m) =>
        m.goal.mode === 'maintain'
          ? [`b${m.goal.low}-${m.goal.high}`, { band: true, text: `${t.lBand} ${trimKg(m.goal.low)}–${trimKg(m.goal.high)} kg` }]
          : [`t${m.goal.target}`, { band: false, text: `${t.lGoal} ${trimKg(m.goal.target)} kg` }],
      ) as Array<[string, { band: boolean; text: string }]>,
    ).values(),
  ];

  // Compare with the period of the same length just before this one. The
  // whole scope has nothing before it, and a period that starts before the
  // goal did has no fair match, so the option is not offered there.
  const [comparing, setComparing] = useState(false);
  const canCompare =
    current != null &&
    firstDate != null &&
    (scope.kind === 'all' || previousBounds(current).from >= firstDate);
  const cmp = useMemo(() => {
    if (!comparing || !current || !canCompare) return null;
    const prev = previousBounds(current);
    const shift = daysBetween(prev.from, current.from);
    const avgs = rollingCalendarAverage(all).filter(
      (p) => p.date >= prev.from && p.date <= prev.to,
    );
    return {
      prev,
      shift,
      series: avgs,
      now: periodSummary(all, current),
      before: periodSummary(all, prev),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparing, canCompare, all, current?.from, current?.to]);
  const maxDate = scope.to ?? todayISO();

  return (
    <section
      aria-labelledby={id}
      className="panel flex min-w-0 flex-col p-3 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1 sm:px-0">
        <h2 id={id} className="text-[15px] font-semibold text-text lg:text-sm">
          {t.dailyWeight}
        </h2>
        <Segmented<RangeKey>
          ariaLabel={t.rangeLabel}
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({
            value: r,
            label: r === 'all' && scope.kind !== 'all' ? t.rangeGoal : t.ranges[r],
          }))}
        />
      </div>

      {range === 'custom' && bounds && (
        <div className="mb-3 grid grid-cols-2 items-end gap-x-3 gap-y-2 px-1 sm:flex sm:flex-wrap sm:px-0">
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={fromId} className="text-[13px] text-muted">
              {t.rangeFrom}
            </label>
            <input
              id={fromId}
              type="date"
              value={bounds.from}
              min={firstDate}
              max={bounds.to}
              onChange={(e) =>
                e.target.value &&
                setCustomRange({ from: e.target.value, to: bounds.to })
              }
              className="field h-11 w-full px-2 sm:w-[170px] sm:px-3 lg:h-9"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={toId} className="text-[13px] text-muted">
              {t.rangeTo}
            </label>
            <input
              id={toId}
              type="date"
              value={bounds.to}
              min={bounds.from}
              max={maxDate}
              onChange={(e) =>
                e.target.value &&
                setCustomRange({ from: bounds.from, to: e.target.value })
              }
              className="field h-11 w-full px-2 sm:w-[170px] sm:px-3 lg:h-9"
            />
          </div>
          <p
            aria-live="polite"
            className="col-span-2 text-[13px] text-muted sm:pb-2.5 lg:pb-2"
          >
            {t.rangeDates(entries.length)}
          </p>
        </div>
      )}

      <div className="inner-card h-[240px] p-1 sm:h-[300px] sm:p-2 lg:h-[340px]">
        {entries.length === 0 ? (
          <p className="flex h-full items-center justify-center p-4 text-[15px] text-muted">
            {t.noDataRange}
          </p>
        ) : (
          <ChartBoundary message={t.chartError} retryLabel={t.retry}>
            <DailyChart
              entries={entries}
              all={all}
              series={series}
              marks={marks}
              changeGood={changeGood}
              overlay={overlay}
              coarse={coarse}
              narrow={narrow}
              previous={cmp ? { series: cmp.series, shift: cmp.shift } : null}
              t={t}
            />
          </ChartBoundary>
        )}
      </div>

      {cmp && canCompare && (
        // One card: how much each period moved (7-day average, first day to
        // last), then the two averages side by side.
        <div aria-live="polite" className="mx-1 mt-3 min-w-0 rounded-inner bg-active px-3 py-2.5 sm:mx-0 sm:px-4">
          <dl className="flex flex-col">
            {[
              { label: t.compareThis, s: cmp.now, range: current! },
              { label: t.comparePrev, s: cmp.before, range: cmp.prev },
            ].map((c) => (
              <div
                key={c.label}
                className="flex min-w-0 items-baseline justify-between gap-3 border-b border-rule py-1.5 last:border-b-0"
              >
                <dt className="min-w-0 text-[14px] text-text">
                  {c.label}
                  <span className="num block text-[13px] text-muted sm:ml-2 sm:inline">
                    {t.fmtShort(c.range.from)} – {t.fmtShort(c.range.to)}
                  </span>
                </dt>
                <dd className="shrink-0 text-[17px]">
                  {c.s ? (
                    <Delta value={c.s.change == null ? null : roundWeight(c.s.change)} />
                  ) : (
                    <span className="text-[14px] text-muted">{t.compareNoneShort}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {cmp.now && cmp.before && (
            <p className="mt-1 text-[13px] text-muted">
              {t.compareAvg(kg(cmp.now.average), kg(cmp.before.average))}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 sm:px-0">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[var(--chart-dot)]"
            />
            {t.lWeighIn}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={
                overlay === 'ma'
                  ? 'h-0.5 w-4 bg-accent'
                  : 'h-0 w-4 border-t-2 border-dashed border-accent'
              }
            />
            {overlay === 'ma' ? t.overlayMa : t.overlayTrend}
          </li>
          {cmp && canCompare && (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-0.5 w-4 bg-[var(--chart-dot)]"
              />
              {t.comparePrev}
            </li>
          )}
          {hasGaps && (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-0 w-4 border-t-2 border-dashed border-accent"
              />
              {t.lGap}
            </li>
          )}
          {markLabels.map((m) => (
            <li key={m.text} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={m.band ? 'h-3 w-4 rounded-[2px] bg-accent-soft' : 'h-0 w-4 border-t border-dashed border-text'}
              />
              {m.text}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          {canCompare && (
            <button
              type="button"
              aria-pressed={comparing}
              onClick={() => setComparing((c) => !c)}
              className={cn(
                'h-11 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors lg:h-9',
                comparing
                  ? 'border-text bg-active text-text'
                  : 'border-control text-text hover:bg-active',
              )}
            >
              {t.compareBtn}
            </button>
          )}
          <Segmented<Overlay>
            ariaLabel={t.dailyWeight}
            value={overlay}
            onChange={setOverlay}
            options={[
              { value: 'ma', label: t.overlayMa },
              { value: 'trend', label: t.overlayTrend },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
