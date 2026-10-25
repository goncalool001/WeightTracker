import { useId, useMemo, useState } from 'react';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useCalendarSeries, useFilteredEntries } from '@/store/selectors';
import { useCoarsePointer, useMedia } from '@/hooks/useViewport';
import {
  averageGaps,
  currentGoal,
  daysBetween,
  isTargetGoal,
  periodSummary,
  previousBounds,
  rangeBounds,
  roundWeight,
  rollingCalendarAverage,
  todayISO,
} from '@/domain';
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
 */
export function DailyPanel() {
  const t = useT();
  const id = useId();
  const fromId = useId();
  const toId = useId();
  const all = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const range = useStore((s) => s.range);
  const custom = useStore((s) => s.customRange);
  const overlay = useStore((s) => s.overlay);
  const setRange = useStore((s) => s.setRange);
  const setCustomRange = useStore((s) => s.setCustomRange);
  const setOverlay = useStore((s) => s.setOverlay);
  const entries = useFilteredEntries();
  const series = useCalendarSeries();
  const coarse = useCoarsePointer();
  const narrow = !useMedia('(min-width: 640px)');
  const goal = currentGoal(goals);
  const hasGaps = overlay === 'ma' && averageGaps(series).length > 0;
  const bounds = range === 'custom' ? rangeBounds(all, 'custom', custom) : null;

  // Compare with the period of the same length just before this one. "All"
  // has nothing before it, so the option is not offered there.
  const [comparing, setComparing] = useState(false);
  const current = rangeBounds(all, range, custom);
  const cmp = useMemo(() => {
    if (!comparing || !current) return null;
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
  }, [comparing, all, current?.from, current?.to]);
  const canCompare = current != null;
  const firstDate = all[0]?.date;
  const maxDate = todayISO();

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
          options={RANGES.map((r) => ({ value: r, label: t.ranges[r] }))}
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
            {t.rangeDates(
              t.fmtDate(bounds.from),
              t.fmtDate(bounds.to),
              entries.length,
            )}
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
              goal={goal}
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
              {t.lPrevious(t.fmtShort(cmp.prev.from), t.fmtShort(cmp.prev.to))}
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
          {goal?.mode === 'maintain' && (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-3 w-4 rounded-[2px] bg-accent-soft"
              />
              {t.lBand} {goal.low}–{goal.high} kg
            </li>
          )}
          {isTargetGoal(goal) && (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-0 w-4 border-t border-dashed border-text"
              />
              {t.lGoal} {goal.target} kg
            </li>
          )}
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
