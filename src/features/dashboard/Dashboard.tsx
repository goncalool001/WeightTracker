import { useState } from 'react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import {
  useFilteredEntries,
  useGoalProjection,
  useGranularity,
  usePeriods,
} from '@/store/selectors';
import { DailyChart } from '@/components/charts/DailyChart';
import { PeriodChart } from '@/components/charts/PeriodChart';
import { MetricGrid } from '@/components/metrics/MetricGrid';
import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { DailyTable } from '@/components/tables/DailyTable';
import { PeriodTable } from '@/components/tables/PeriodTable';
import { Trash2 } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LogEntryForm } from '@/features/log-entry/LogEntryForm';
import { GoalControl } from '@/features/log-entry/GoalControl';
import { EmptyState } from './EmptyState';
import type { Granularity, Overlay, RangeKey } from '@/types';

/** The full analytics dashboard, laid out as a vertical, web-first page. */
export function Dashboard() {
  const t = useT();
  const totalEntries = useStore((s) => s.entries.length);
  const goalWeight = useStore((s) => s.goalWeight);
  const overlay = useStore((s) => s.overlay);
  const range = useStore((s) => s.range);
  const showLabels = useStore((s) => s.showLabels);
  const setOverlay = useStore((s) => s.setOverlay);
  const setRange = useStore((s) => s.setRange);
  const setGranularity = useStore((s) => s.setGranularity);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const replaceEntries = useStore((s) => s.replaceEntries);

  const granularity = useGranularity();
  const filtered = useFilteredEntries();
  const periods = usePeriods();
  const projection = useGoalProjection();

  const periodTitle =
    granularity === 'monthly' ? t.monthlyAvg : t.weeklyAvg;
  const periodTableTitle =
    granularity === 'monthly' ? t.monthlyAvgs : t.weeklyAvgs;

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteEntry(pendingDelete);
    toast.success(t.toastDeleted(t.fmtDateLong(pendingDelete)));
    setPendingDelete(null);
  }

  function clearAll() {
    const count = totalEntries;
    replaceEntries([]); // clears locally and, when signed in, in the cloud too
    toast.success(t.toastDeletedAll(count));
    setConfirmClearAll(false);
  }

  const OVERLAY_OPTIONS: { value: Overlay; label: string }[] = [
    { value: 'trend', label: t.overlayTrend },
    { value: 'ma', label: t.overlayMa },
  ];

  const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
    { value: 'weekly', label: t.granWeekly },
    { value: 'monthly', label: t.granMonthly },
  ];

  const RANGE_SEGMENTS: { value: RangeKey; label: string }[] = [
    { value: '7d', label: t.range7d },
    { value: '30d', label: t.range30d },
    { value: '90d', label: t.range90d },
    { value: 'ytd', label: t.rangeYtd },
    { value: 'all', label: t.rangeAll },
  ];

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8">
      {/* 1 · KPI cards */}
      <MetricGrid />

      {/* 2 · Log weight + Goal */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <LogEntryForm />
        <GoalControl />
      </div>

      {totalEntries === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Range scope control */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text">{t.trends}</h2>
              <p className="text-xs text-muted">
                {t.showingOf(filtered.length, totalEntries)}
              </p>
            </div>
            <Segmented
              ariaLabel={t.trends}
              options={RANGE_SEGMENTS}
              value={range}
              onChange={(v: RangeKey) => setRange(v)}
            />
          </div>

          {/* 3 · Daily Weight chart */}
          <Panel
            title={t.dailyWeight}
            actions={
              <Segmented
                ariaLabel={t.overlayTrend}
                options={OVERLAY_OPTIONS}
                value={overlay}
                onChange={(v: Overlay) => setOverlay(v)}
              />
            }
            bodyClassName="p-2 sm:p-3"
          >
            <div className="h-[320px] sm:h-[400px] lg:h-[460px]">
              <DailyChart
                entries={filtered}
                goalWeight={goalWeight}
                overlay={overlay}
                showLabels={showLabels}
                t={t}
              />
            </div>
          </Panel>

          {/* 4 · Insights */}
          <InsightsPanel />

          {/* 5 · Weekly / Monthly average chart */}
          <Panel
            title={periodTitle}
            actions={
              <Segmented
                ariaLabel={t.granWeekly}
                options={GRANULARITY_OPTIONS}
                value={granularity}
                onChange={(v: Granularity) => setGranularity(v)}
              />
            }
            bodyClassName="p-2 sm:p-3"
          >
            <div className="h-[300px] sm:h-[360px] lg:h-[420px]">
              <PeriodChart
                periods={periods}
                goalWeight={goalWeight}
                projection={projection}
                granularity={granularity}
                showLabels={showLabels}
                t={t}
              />
            </div>
          </Panel>

          {/* 6 · Daily Log table */}
          <Panel
            title={t.dailyLog}
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClearAll(true)}
                className="text-bad hover:bg-bad/10 hover:text-bad"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t.deleteAll}</span>
              </Button>
            }
            bodyClassName="p-0"
          >
            <DailyTable entries={filtered} onDelete={setPendingDelete} />
          </Panel>

          {/* 7 · Period averages table */}
          <Panel title={periodTableTitle} bodyClassName="p-0">
            <PeriodTable periods={periods} granularity={granularity} />
          </Panel>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.deleteTitle}
        description={
          pendingDelete
            ? t.deleteDesc(t.fmtDateLong(pendingDelete))
            : ''
        }
        confirmLabel={t.deleteBtn}
        cancelLabel={t.cancelBtn}
        destructive
        onConfirm={confirmDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmClearAll}
        title={t.deleteAllTitle}
        description={t.deleteAllDesc(totalEntries)}
        confirmLabel={t.deleteAll}
        cancelLabel={t.cancelBtn}
        destructive
        onConfirm={clearAll}
        onOpenChange={(o) => !o && setConfirmClearAll(false)}
      />
    </div>
  );
}
