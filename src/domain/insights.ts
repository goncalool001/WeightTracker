import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { signed } from '@/lib/format';
import { daysBetween, rollingCalendarAverage, weekdayOffsets } from './calendar';
import { currentGoal } from './goals';
import { monthlyPeriods, weeklyPeriods } from './periods';
import { categoryEffects } from './effects';
import type { CategoryId } from './categories';
import type { Goal, Insight, InsightStrings, WeightEntry } from '@/types';

/**
 * Insight generator. Each insight is a full-sentence observation that surfaces
 * a pattern, trend or achievement not already obvious from the KPI cards.
 * Text is produced by the caller-supplied `strings` object so the domain
 * stays locale-agnostic.
 */

/** Fallback English string factories (used by tests and as default). */
const defaultStrings: InsightStrings = {
  windowLost: (kg, days) => `You've lost ${kg} over the last ${days} days.`,
  windowGained: (kg, days) => `You've gained ${kg} over the last ${days} days.`,
  accelAccel: (recent, prior) =>
    `Your loss is speeding up: ${recent} in the last 30 days against ${prior} in the 30 before.`,
  accelSlow: (recent, prior) =>
    `Your loss is slowing: ${recent} in the last 30 days against ${prior} in the 30 before.`,
  consistency: (drops, m) =>
    `Weight decreased in ${drops} of your last ${m} measurements.`,
  bestWeek: (start, end, kg) =>
    `Your fastest week was ${start} – ${end}, down ${kg}.`,
  contribution: (pct) =>
    `The last 14 days account for ${pct}% of your total weight loss.`,
  compareStronger: (thisRate, lastRate) =>
    `This month's pace (${thisRate} kg/wk) is stronger than last month's (${lastRate} kg/wk).`,
  compareWeaker: (thisRate, lastRate) =>
    `This month's pace (${thisRate} kg/wk) is weaker than last month's (${lastRate} kg/wk).`,
  categoryEffect: (label, kg, n, heavier) =>
    `After a day with "${label}" you weigh ${kg} kg ${heavier ? 'more' : 'less'} on average (${n} weigh-ins).`,
  weekday: (day, kg, heavier) =>
    `On ${['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][day]} you weigh ${kg} kg ${heavier ? 'more' : 'less'} than the rest of that week, on average.`,
  avgSpread: (lo, hi, days) =>
    `Your 7-day average stayed between ${lo} and ${hi} kg over the last ${days} days.`,
};

const defaultFmtDate = (iso: string) =>
  format(parseISO(iso), 'dd MMM yyyy');

export interface InsightInput {
  entries: WeightEntry[];
  /** Goal history; the current goal decides which insights apply. */
  goals: Goal[];
  /** Category label for the category insight; without it that insight is skipped. */
  catLabel?: (id: CategoryId) => string;
  /** Locale-specific string factories. Defaults to English. */
  strings?: InsightStrings;
  /** Locale-aware ISO→human date formatter. Defaults to English. */
  fmtDate?: (iso: string) => string;
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
  const {
    entries,
    goals,
    catLabel,
    strings: s = defaultStrings,
    fmtDate = defaultFmtDate,
  } = input;
  if (entries.length < 2) return [];

  const insights: Insight[] = [];
  const weights = entries.map((e) => e.weight);
  const current = weights[weights.length - 1];
  const start = weights[0];
  const totalLoss = start - current;
  const spanDays = differenceInCalendarDays(
    parseISO(entries[entries.length - 1].date),
    parseISO(entries[0].date),
  );

  const goal = currentGoal(goals);

  // 0 · The category most clearly linked to the scale, once it is reliable
  // (10+ weigh-ins and a range that excludes zero). See effects.ts.
  if (catLabel) {
    const f = categoryEffects(entries).finding;
    if (f && f.effect != null) {
      insights.push({
        id: 'category',
        icon: 'category',
        tone: 'neutral',
        text: s.categoryEffect(catLabel(f.id), Math.abs(f.effect).toFixed(1), f.n, f.effect > 0),
      });
    }
  }

  // 1 · Maintenance: how far the 7-day average moved in the last 4 weeks
  // (the share of weigh-ins in the band is on the Today ruler)
  if (goal?.mode === 'maintain') {
    const avgs = rollingCalendarAverage(entries)
      .slice(-28)
      .map((p) => p.average)
      .filter((v): v is number => v != null);
    if (avgs.length >= 14) {
      insights.push({
        id: 'spread',
        icon: 'band',
        tone: 'neutral',
        text: s.avgSpread(Math.min(...avgs).toFixed(1), Math.max(...avgs).toFixed(1), 28),
      });
    }
  }

  // 2 · Weekday pattern: one weekday that sits clearly off its own week.
  // Needs 8 weeks of history and 6 samples of that weekday; small offsets
  // are day-to-day noise and are not reported.
  if (daysBetween(entries[0].date, entries[entries.length - 1].date) >= 56) {
    const days = weekdayOffsets(entries);
    let best = -1;
    days.forEach((d, i) => {
      if (d.n >= 6 && (best < 0 || Math.abs(d.offset) > Math.abs(days[best].offset))) best = i;
    });
    if (best >= 0 && Math.abs(days[best].offset) >= 0.3) {
      const off = days[best].offset;
      insights.push({
        id: 'weekday',
        icon: 'weekday',
        tone: 'neutral',
        text: s.weekday(best, Math.abs(off).toFixed(1), off > 0),
      });
    }
  }

  // 3 · Change over a meaningful window
  const window = [90, 60, 30].find((d) => spanDays >= d);
  if (window) {
    const change = changeOverDays(entries, window);
    if (change && Math.abs(change.delta) >= 0.3) {
      insights.push({
        id: 'window',
        icon: 'window',
        tone: change.delta < 0 ? 'good' : 'bad',
        text:
          change.delta < 0
            ? s.windowLost(absKg(change.delta), window)
            : s.windowGained(absKg(change.delta), window),
      });
    }
  }

  // 4 · Acceleration — compare the last 30 days to the 30 before
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
            text: accelerating
              ? s.accelAccel(absKg(recent), absKg(prior))
              : s.accelSlow(absKg(recent), absKg(prior)),
          });
        }
      }
    }
  }

  // 5 · Direction consistency over recent measurements
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
        text: s.consistency(drops, m),
      });
    }
  }

  // 6 · Fastest weight-loss week
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
        text: s.bestWeek(fmtDate(w.start), fmtDate(w.end), absKg(bestDelta)),
      });
    }
  }

  // 7 · Recent contribution to total loss
  if (totalLoss > 0.5 && spanDays > 14) {
    const recent14 = changeOverDays(entries, 14);
    if (recent14 && recent14.delta < 0) {
      const pct = (Math.abs(recent14.delta) / totalLoss) * 100;
      if (pct >= 15) {
        insights.push({
          id: 'contribution',
          icon: 'contribution',
          tone: 'accent',
          text: s.contribution(pct.toFixed(0)),
        });
      }
    }
  }

  // 8 · This month's pace vs last month's
  const mp = monthlyPeriods(entries);
  if (mp.length >= 2) {
    const thisM = mp[mp.length - 1];
    const lastM = mp[mp.length - 2];
    const thisRate = (thisM.average - lastM.average) / 4.345;
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
            text: stronger
              ? s.compareStronger(
                  signed(thisRate, 2),
                  signed(lastRate, 2),
                )
              : s.compareWeaker(
                  signed(thisRate, 2),
                  signed(lastRate, 2),
                ),
          });
        }
      }
    }
  }

  return insights;
}
