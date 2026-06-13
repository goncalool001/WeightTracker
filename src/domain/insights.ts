import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatDate } from '@/lib/format';
import { goalProjection } from './projection';
import { weeklyAverages } from './weekly';
import { monthlyPeriods, weeklyPeriods } from './periods';
import type { Insight, WeightEntry } from '@/types';

/**
 * Insight generator. The goal is an *analytical layer* on top of the data:
 * each insight is a full-sentence observation that surfaces a pattern, trend or
 * achievement not already obvious from the KPI cards. Quality over quantity —
 * an insight is only emitted when the data supports it and it's noteworthy.
 */

export interface InsightInput {
  /** Full dataset, ascending by date. */
  entries: WeightEntry[];
  goal: number | null;
}

/** The most recent entry on or before the given ISO date, or null. */
function entryOnOrBefore(
  entries: WeightEntry[],
  isoDate: string,
): WeightEntry | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].date <= isoDate) return entries[i];
  }
  return null;
}

/** Shift an ISO date by `-days` and return ISO. */
function shiftISO(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Weight change over the last `days`, vs the measurement nearest that far back. */
function changeOverDays(
  entries: WeightEntry[],
  days: number,
): { delta: number; from: number; spanDays: number } | null {
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const target = shiftISO(latest.date, days);
  const base = entryOnOrBefore(entries, target);
  if (!base || base.date === latest.date) return null;
  return {
    delta: latest.weight - base.weight,
    from: base.weight,
    spanDays: differenceInCalendarDays(
      parseISO(latest.date),
      parseISO(base.date),
    ),
  };
}

function absKg(n: number): string {
  return `${Math.abs(n).toFixed(1)} kg`;
}

export function buildInsights(input: InsightInput): Insight[] {
  const { entries, goal } = input;
  if (entries.length < 2) return [];

  const insights: Insight[] = [];
  const weights = entries.map((e) => e.weight);
  const current = weights[weights.length - 1];
  const start = weights[0];
  const totalLoss = start - current; // positive = net loss
  const spanDays = differenceInCalendarDays(
    parseISO(entries[entries.length - 1].date),
    parseISO(entries[0].date),
  );

  const weekly = weeklyAverages(entries);

  // 1 · Goal pace / ETA — distinct from the rate KPI: gives a calendar date.
  if (goal != null) {
    const reached =
      (start > goal && current <= goal) || (start < goal && current >= goal);
    if (reached) {
      insights.push({
        id: 'goal-reached',
        icon: 'goalPace',
        tone: 'good',
        text: `You've reached your goal of ${goal.toFixed(1)} kg — nice work.`,
      });
    } else {
      const projection = goalProjection(weekly, goal);
      if (projection) {
        const weeks = Math.round(projection.weeksRemaining);
        insights.push({
          id: 'goal-pace',
          icon: 'goalPace',
          tone: 'accent',
          text: `At your current pace, you'll reach ${goal.toFixed(1)} kg around ${formatDate(
            projection.date,
          )} — about ${weeks} week${weeks === 1 ? '' : 's'} away.`,
        });
      }
    }
  }

  // 2 · Progress toward goal (%) with a bar — adds context KPIs don't show.
  if (goal != null && start !== goal) {
    const pct = Math.min(
      100,
      Math.max(0, ((start - current) / (start - goal)) * 100),
    );
    if (pct > 0 && pct < 100) {
      insights.push({
        id: 'progress',
        icon: 'progress',
        tone: 'accent',
        text: `You're ${pct.toFixed(0)}% of the way from your start (${start.toFixed(
          1,
        )} kg) to your goal (${goal.toFixed(1)} kg).`,
        progress: pct,
      });
    }
  }

  // 3 · Change over a meaningful window (largest standard window the data spans).
  const window = [90, 60, 30].find((d) => spanDays >= d);
  if (window) {
    const change = changeOverDays(entries, window);
    if (change && Math.abs(change.delta) >= 0.3) {
      const verb = change.delta < 0 ? 'lost' : 'gained';
      insights.push({
        id: 'window',
        icon: 'window',
        tone: change.delta < 0 ? 'good' : 'bad',
        text: `You've ${verb} ${absKg(change.delta)} over the last ${window} days.`,
      });
    }
  }

  // 4 · Acceleration — compare the last 30 days to the 30 before that.
  if (spanDays >= 60) {
    const latestISO = entries[entries.length - 1].date;
    const at0 = entries[entries.length - 1];
    const at30 = entryOnOrBefore(entries, shiftISO(latestISO, 30));
    const at60 = entryOnOrBefore(entries, shiftISO(latestISO, 60));
    if (at30 && at60 && at30.date !== at0.date && at60.date !== at30.date) {
      const recent = at0.weight - at30.weight;
      const prior = at30.weight - at60.weight;
      if (recent < -0.1 && prior < -0.1) {
        const accelerating = Math.abs(recent) > Math.abs(prior) * 1.1;
        const slowing = Math.abs(recent) < Math.abs(prior) * 0.9;
        if (accelerating || slowing) {
          insights.push({
            id: 'accel',
            icon: 'accel',
            tone: accelerating ? 'good' : 'neutral',
            text: `Your weight loss is ${
              accelerating ? 'accelerating' : 'slowing'
            } — ${absKg(recent)} in the last 30 days vs ${absKg(
              prior,
            )} the 30 days before.`,
          });
        }
      }
    }
  }

  // 5 · Direction consistency over recent measurements.
  if (entries.length >= 4) {
    const m = Math.min(10, entries.length - 1);
    const recent = weights.slice(-(m + 1));
    let drops = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] < recent[i - 1] - 0.001) drops++;
    }
    if (drops >= Math.ceil(m * 0.6)) {
      insights.push({
        id: 'consistency',
        icon: 'consistency',
        tone: 'good',
        text: `Weight decreased in ${drops} of your last ${m} measurements.`,
      });
    }
  }

  // 6 · Fastest weight-loss week.
  const wp = weeklyPeriods(entries);
  if (wp.length >= 2) {
    let bestIdx = 1;
    let bestDelta = wp[1].average - wp[0].average;
    for (let i = 2; i < wp.length; i++) {
      const d = wp[i].average - wp[i - 1].average;
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = i;
      }
    }
    if (bestDelta < -0.2) {
      const w = wp[bestIdx];
      insights.push({
        id: 'best',
        icon: 'best',
        tone: 'good',
        text: `Your fastest week was ${formatDate(w.start)} – ${formatDate(
          w.end,
        )}, down ${absKg(bestDelta)}.`,
      });
    }
  }

  // 7 · Recent contribution to total loss.
  if (totalLoss > 0.5 && spanDays > 14) {
    const recent14 = changeOverDays(entries, 14);
    if (recent14 && recent14.delta < 0) {
      const pct = (Math.abs(recent14.delta) / totalLoss) * 100;
      if (pct >= 15) {
        insights.push({
          id: 'contribution',
          icon: 'contribution',
          tone: 'accent',
          text: `The last 14 days account for ${pct.toFixed(
            0,
          )}% of your total weight loss.`,
        });
      }
    }
  }

  // 8 · This month's pace vs last month's.
  const mp = monthlyPeriods(entries);
  if (mp.length >= 2) {
    const thisM = mp[mp.length - 1];
    const lastM = mp[mp.length - 2];
    const thisRate = (thisM.average - lastM.average) / 4.345; // kg/week-ish
    // Approx previous-month rate from the month before, if present.
    if (mp.length >= 3) {
      const prevM = mp[mp.length - 3];
      const lastRate = (lastM.average - prevM.average) / 4.345;
      if (thisRate < -0.05 && lastRate < -0.05) {
        const stronger = Math.abs(thisRate) > Math.abs(lastRate) * 1.1;
        const weaker = Math.abs(thisRate) < Math.abs(lastRate) * 0.9;
        if (stronger || weaker) {
          insights.push({
            id: 'compare',
            icon: 'compare',
            tone: stronger ? 'good' : 'neutral',
            text: `This month's pace (${thisRate.toFixed(
              2,
            )} kg/wk) is ${stronger ? 'stronger' : 'weaker'} than last month's (${lastRate.toFixed(
              2,
            )} kg/wk).`,
          });
        }
      }
    }
  }

  return insights;
}
