import {
  CalendarDays,
  Flag,
  Gauge,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { RATE_BAND, WEEK_BAND } from '@/lib/constants';
import { formatDate, formatDeltaWeight, formatWeight } from '@/lib/format';
import { useGoalProjection, useMetrics } from '@/store/selectors';
import { MetricCard, type Tone } from './MetricCard';

/** Tone from a delta where *down* (weight loss) is good. */
function lossTone(delta: number, band: number): Tone {
  if (delta < -band) return 'good';
  if (delta > band) return 'bad';
  return 'neutral';
}

/** The responsive KPI strip derived from the full dataset. */
export function MetricGrid() {
  const m = useMetrics();
  const projection = useGoalProjection();

  const rateTone: Tone =
    m.ratePerWeek == null ? 'neutral' : lossTone(m.ratePerWeek, RATE_BAND);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        label="Total entries"
        value={String(m.totalEntries)}
        icon={<CalendarDays className="h-4 w-4" />}
      />

      <MetricCard
        label="Latest"
        value={m.latest ? formatWeight(m.latest.weight) : '—'}
        sub={m.latest ? formatDate(m.latest.date) : undefined}
        icon={<Scale className="h-4 w-4" />}
      />

      <MetricCard
        label="This week"
        value={m.thisWeek ? formatWeight(m.thisWeek.average) : '—'}
        sub={m.thisWeek ? `${m.thisWeek.measurements}× measured` : undefined}
        icon={<CalendarDays className="h-4 w-4" />}
      />

      <MetricCard
        label="vs last week"
        value={m.vsLastWeek ? formatWeight(m.vsLastWeek.average) : '—'}
        sub={
          m.vsLastWeek ? formatDeltaWeight(m.vsLastWeek.delta) : 'need 2+ weeks'
        }
        tone={m.vsLastWeek ? lossTone(m.vsLastWeek.delta, WEEK_BAND) : 'neutral'}
        icon={
          m.vsLastWeek && m.vsLastWeek.delta > 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )
        }
      />

      <MetricCard
        label="Since week 1"
        value={m.sinceStart ? formatDeltaWeight(m.sinceStart.delta) : '—'}
        sub={
          m.sinceStart
            ? `${m.sinceStart.firstAverage.toFixed(1)} → ${m.sinceStart.currentAverage.toFixed(1)} kg`
            : undefined
        }
        tone={m.sinceStart ? lossTone(m.sinceStart.delta, WEEK_BAND) : 'neutral'}
        icon={<Flag className="h-4 w-4" />}
      />

      <MetricCard
        label="Rate"
        value={
          m.ratePerWeek == null
            ? '—'
            : `${formatDeltaWeight(m.ratePerWeek)}/wk`
        }
        sub={
          projection
            ? `goal ~${formatDate(projection.date)}`
            : m.ratePerWeek != null
              ? 'trend rate of change'
              : undefined
        }
        tone={rateTone}
        icon={<Gauge className="h-4 w-4" />}
      />
    </div>
  );
}
