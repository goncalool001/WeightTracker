import { useId } from 'react';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { usePeriods } from '@/store/selectors';
import { DailyTable } from '@/features/entries/DailyTable';
import { PeriodTable } from '@/features/entries/PeriodTable';
import { EffectsPanel } from '@/features/entries/EffectsPanel';
import { Segmented } from '@/components/ui/Segmented';
import { ScreenTitle } from './ScreenTitle';
import type { Granularity } from '@/types';

/**
 * Entries: every weigh-in (edit, delete with undo) beside the weekly or
 * monthly averages. Two columns from 1024px (7 + 5 of the 12-column grid).
 */
export function LogScreen() {
  const t = useT();
  const dailyId = useId();
  const periodId = useId();
  const entries = useStore((s) => s.entries);
  const granularity = useStore((s) => s.granularity);
  const setGranularity = useStore((s) => s.setGranularity);
  const periods = usePeriods('all');

  const sub =
    entries.length > 0
      ? t.logScreenSub(entries.length, t.fmtDate(entries[0].date), t.fmtDate(entries[entries.length - 1].date))
      : t.noEntriesRange;

  return (
    <>
      <ScreenTitle title={t.logScreenTitle} sub={sub} />
      {/* From 1024px the two tables share one height and scroll inside their
          panels (headers stay in view), so the row ends on one line. */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <EffectsPanel className="lg:col-span-12" />
        <section aria-labelledby={dailyId} className="panel flex min-w-0 flex-col p-4 sm:p-5 lg:col-span-7 lg:max-h-[760px]">
          <h2 id={dailyId} className="mb-2 flex min-h-9 items-center text-[15px] font-semibold text-text lg:text-sm">
            {t.pesagens}
          </h2>
          {entries.length === 0 ? (
            <p className="text-[15px] text-muted">{t.noEntriesRange}</p>
          ) : (
            <div tabIndex={0} aria-labelledby={dailyId} role="region" className="min-h-0 flex-1 lg:overflow-y-auto">
              <DailyTable entries={entries} />
            </div>
          )}
        </section>
        <section aria-labelledby={periodId} className="panel flex min-w-0 flex-col p-4 sm:p-5 lg:col-span-5 lg:max-h-[760px]">
          <div className="mb-2 flex min-h-9 flex-wrap items-center justify-between gap-2">
            <h2 id={periodId} className="text-[15px] font-semibold text-text lg:text-sm">
              {granularity === 'weekly' ? t.avgWeekly : t.avgMonthly}
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
          {periods.length === 0 ? (
            <p className="text-[15px] text-muted">{t.noEntriesRange}</p>
          ) : (
            <div tabIndex={0} aria-labelledby={periodId} role="region" className="min-h-0 flex-1 lg:overflow-y-auto">
              <PeriodTable periods={periods} granularity={granularity} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
