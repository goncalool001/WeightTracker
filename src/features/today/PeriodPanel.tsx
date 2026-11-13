import { useId } from 'react';
import { useT } from '@/i18n';
import { todayISO } from '@/domain';
import { useStore } from '@/store/useStore';
import { useCallback } from 'react';
import { useChangeDirection, useGoodDirection, usePeriods, useStatus } from '@/store/selectors';
import { useCoarsePointer, useMedia } from '@/hooks/useViewport';
import { PeriodChart } from '@/components/charts/PeriodChart';
import { ChartBoundary } from '@/components/states/ChartBoundary';
import { Segmented } from '@/components/ui/Segmented';
import { cn } from '@/lib/cn';
import type { Granularity, PeriodAverage } from '@/types';

/** Weeks in an average month (365.25 / 12 / 7). */
const WEEKS_PER_MONTH = 4.348;

/**
 * Week-on-week (or month-on-month) change of the average, as signed columns.
 * Each column is judged by the goal in force over its two periods; the one
 * that runs across a change of direction is grey.
 */
export function PeriodPanel({ className }: { className?: string }) {
  const t = useT();
  const id = useId();
  const granularity = useStore((s) => s.granularity);
  const setGranularity = useStore((s) => s.setGranularity);
  const all = usePeriods('all');
  const inRange = usePeriods('active');
  const coarse = useCoarsePointer();
  const narrow = !useMedia('(min-width: 640px)');

  const good = useGoodDirection();
  const changeGood = useChangeDirection();
  // The week or month in progress ends today, as on the cards above.
  const cap = todayISO();
  const goodFor = useCallback(
    (prev: PeriodAverage, p: PeriodAverage) => changeGood(prev.start, p.end < cap ? p.end : cap),
    [changeGood, cap],
  );
  // The goal's target pace as a line across the bars: per week, or the same
  // pace over an average month.
  const pace = useStatus().pace;
  const target = pace ? (granularity === 'weekly' ? pace.target : pace.target * WEEKS_PER_MONTH) : null;
  const swatch = (dir: 'down' | 'up') =>
    good == null ? 'bg-cell-off' : good === dir ? 'bg-positive' : 'bg-negative';
  const from = inRange.length ? all.findIndex((p) => p.start === inRange[0].start) : all.length;
  const to = inRange.length ? all.findIndex((p) => p.start === inRange[inRange.length - 1].start) + 1 : 0;
  const drawable = to - Math.max(from, 1);

  return (
    <section aria-labelledby={id} className={cn('panel flex min-w-0 flex-col p-3 sm:p-5', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1 sm:px-0">
        <h2 id={id} className="text-[15px] font-semibold text-text lg:text-sm">
          {granularity === 'weekly' ? t.periodWeekly : t.periodMonthly}
        </h2>
        <Segmented<Granularity>
          ariaLabel={t.granLabel}
          value={granularity}
          onChange={setGranularity}
          options={[
            { value: 'weekly', label: t.granWeekly },
            { value: 'monthly', label: t.granMonthly },
          ]}
        />
      </div>
      <div className="min-h-[170px] flex-1 lg:min-h-[130px]">
        {drawable < 1 ? (
          <p className="flex h-full min-h-[170px] items-center p-4 text-[15px] text-muted">{t.noDataRange}</p>
        ) : (
          <ChartBoundary message={t.chartError} retryLabel={t.retry}>
            <div className="h-full min-h-[170px] lg:min-h-[130px]">
              <PeriodChart
                periods={all.slice(0, to)}
                from={from}
                granularity={granularity}
                goodFor={goodFor}
                target={target}
                coarse={coarse}
                narrow={narrow}
                t={t}
              />
            </div>
          </ChartBoundary>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[13px] text-muted sm:px-0">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-3 w-2 ${swatch('down')}`} />
          <span aria-hidden="true">{'▼'}</span>
          {t.axisLost}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-3 w-2 ${swatch('up')}`} />
          <span aria-hidden="true">{'▲'}</span>
          {t.axisGained}
        </li>
        {target != null && drawable >= 1 && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0 w-4 border-t border-dashed border-text" />
            {t.lTargetPace}
          </li>
        )}
      </ul>
    </section>
  );
}
