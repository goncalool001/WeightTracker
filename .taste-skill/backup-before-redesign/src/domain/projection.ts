import { addWeeks, format, parseISO } from 'date-fns';
import { MAX_PROJECTION_WEEKS } from '@/lib/constants';
import { linearFit } from './trend';
import type { GoalProjection, WeeklyAverage } from '@/types';

/**
 * Project when the goal weight will be reached by extrapolating the weekly
 * trend line, exactly as the desktop app does on the weekly chart.
 *
 * The weekly trend is fit over the week index (0..n-1). We solve the trend for
 * the goal weight, convert to "weeks remaining" past the last week, and return
 * a calendar date — but only when the projection is sane
 * (`0 < weeksRemaining < 260`). Returns `null` otherwise.
 */
export function goalProjection(
  weekly: WeeklyAverage[],
  goalWeight: number | null,
): GoalProjection | null {
  if (goalWeight === null || weekly.length < 2) return null;

  const xs = weekly.map((_, i) => i);
  const ys = weekly.map((w) => w.averageWeight);
  const { slope, intercept } = linearFit(xs, ys);

  if (Math.abs(slope) <= 0.001) return null;

  const xGoal = (goalWeight - intercept) / slope;
  const weeksRemaining = xGoal - (weekly.length - 1);

  if (weeksRemaining <= 0 || weeksRemaining >= MAX_PROJECTION_WEEKS) {
    return null;
  }

  const lastEnd = parseISO(weekly[weekly.length - 1].weekEnd);
  const goalDate = addWeeks(lastEnd, weeksRemaining);

  return { date: format(goalDate, 'yyyy-MM-dd'), weeksRemaining };
}
