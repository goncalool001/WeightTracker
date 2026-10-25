import { useT } from '@/i18n';
import { todayISO } from '@/domain';
import { useStore } from '@/store/useStore';
import { useStatus } from '@/store/selectors';
import { routeHref } from '@/hooks/useRoute';
import { KpiStrip } from '@/features/today/KpiStrip';
import { Ruler } from '@/features/today/Ruler';
import { DailyPanel } from '@/features/today/DailyPanel';
import { PeriodPanel } from '@/features/today/PeriodPanel';
import { InsightsPanel } from '@/features/today/InsightsPanel';
import { LogForm } from '@/features/log/LogForm';
import { ScreenTitle } from './ScreenTitle';

/**
 * Today. The KPIs answer "where am I, and am I on track?"; the ruler shows where today sits against
 * the goal; then the chart, the analysis and the period changes.
 *
 * Grid (≥1024px): a 1100px column of 12 × 77px columns with 16px gutters
 * (12 × 77 + 11 × 16 = 1100). Rows span 3/3/3/3, then 9 + 3, then 12, then
 * 6 + 6, so every internal edge meets one above it.
 */
export function TodayScreen() {
  const t = useT();
  const s = useStatus();
  const total = useStore((st) => st.entries.length);
  const empty = s.phase === 'empty';
  // Shown only when the cards are not about today.
  const stale = s.latest && s.latest.date !== todayISO() ? t.lastWeighIn(t.fmtShort(s.latest.date)) : undefined;

  return (
    <>
      {empty ? (
        <ScreenTitle title={t.emptyHead} serif />
      ) : (
        <ScreenTitle title={t.nav.today} sub={stale} hidden />
      )}

      <KpiStrip s={s} />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        {empty ? (
          <section className="panel flex min-h-[160px] flex-col justify-center gap-3 p-5 lg:col-span-9">
            <p className="text-[15px] text-text">{t.emptySub}</p>
            <a
              href={routeHref('data')}
              className="inline-flex h-11 w-fit items-center rounded-full border border-control px-4 text-sm font-medium text-text hover:bg-active lg:h-9"
            >
              {t.importTitle}
            </a>
          </section>
        ) : (
          <div className="min-w-0 lg:col-span-9 [&>section]:h-full">
            <Ruler s={s} />
          </div>
        )}
        <div className="hidden lg:col-span-3 lg:block">
          <LogForm variant="panel" />
        </div>
      </div>

      <DailyPanel />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <InsightsPanel className="lg:col-span-6" />
        <PeriodPanel className="lg:col-span-6" />
      </div>

      {total > 0 && (
        <a
          href={routeHref('log')}
          className="flex h-12 items-center justify-between rounded-full border border-control px-5 text-[15px] font-medium text-text hover:bg-active lg:hidden"
        >
          {t.viewAll(total)}
          <span aria-hidden="true">{'→'}</span>
        </a>
      )}
    </>
  );
}
