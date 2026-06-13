import { useState } from 'react';
import { toast } from 'sonner';
import { RANGE_OPTIONS } from '@/lib/constants';
import { formatDateLong } from '@/lib/format';
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
import { Panel } from '@/components/ui/Panel';
import { Segmented } from '@/components/ui/Segmented';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LogEntryForm } from '@/features/log-entry/LogEntryForm';
import { GoalControl } from '@/features/log-entry/GoalControl';
import { EmptyState } from './EmptyState';
import type { Granularity, Overlay, RangeKey } from '@/types';

const OVERLAY_OPTIONS: { value: Overlay; label: string }[] = [
  { value: 'trend', label: 'Trend' },
  { value: 'ma', label: '7-day avg' },
];

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const RANGE_SEGMENTS = RANGE_OPTIONS.map((r) => ({
  value: r.key,
  label: r.label,
}));

/** The full analytics dashboard, laid out as a vertical, web-first page. */
export function Dashboard() {
  const totalEntries = useStore((s) => s.entries.length);
  const goalWeight = useStore((s) => s.goalWeight);
  const overlay = useStore((s) => s.overlay);
  const range = useStore((s) => s.range);
  const setOverlay = useStore((s) => s.setOverlay);
  const setRange = useStore((s) => s.setRange);
  const setGranularity = useStore((s) => s.setGranularity);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const granularity = useGranularity();
  const filtered = useFilteredEntries();
  const periods = usePeriods();
  const projection = useGoalProjection();

  const periodNoun = granularity === 'monthly' ? 'Monthly' : 'Weekly';

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteEntry(pendingDelete);
    toast.success(`Deleted entry for ${formatDateLong(pendingDelete)}`);
    setPendingDelete(null);
  }

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
          {/* Range scope control (applies to charts, insights & tables) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text">Trends</h2>
              <p className="text-xs text-muted">
                Showing {filtered.length} of {totalEntries} entries
              </p>
            </div>
            <Segmented
              ariaLabel="Time range"
              options={RANGE_SEGMENTS}
              value={range}
              onChange={(v: RangeKey) => setRange(v)}
            />
          </div>

          {/* 3 · Daily Weight chart — full width */}
          <Panel
            title="Daily weight"
            actions={
              <Segmented
                ariaLabel="Daily overlay"
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
              />
            </div>
          </Panel>

          {/* 4 · Insights */}
          <InsightsPanel />

          {/* 5 · Weekly / Monthly average chart — full width */}
          <Panel
            title={`${periodNoun} average`}
            actions={
              <Segmented
                ariaLabel="Aggregation granularity"
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
              />
            </div>
          </Panel>

          {/* 6 · Daily Log table — full width */}
          <Panel title="Daily log" bodyClassName="p-0">
            <DailyTable entries={filtered} onDelete={setPendingDelete} />
          </Panel>

          {/* 7 · Weekly / Monthly averages table — full width */}
          <Panel title={`${periodNoun} averages`} bodyClassName="p-0">
            <PeriodTable periods={periods} granularity={granularity} />
          </Panel>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete entry?"
        description={
          pendingDelete
            ? `Delete the entry for ${formatDateLong(pendingDelete)}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      />
    </div>
  );
}
