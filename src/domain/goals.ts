import { roundWeight } from './entries';
import type { Goal, GoalMode, StoredGoal, WeightEntry } from '@/types';

/**
 * Goal history. Goals are never edited in place once a day has passed: a new
 * goal ends the current one, so the history keeps every target that was set.
 */

/** A goal with a single target weight (lose or gain), as opposed to a range. */
export function isTargetGoal(goal: Goal | null): goal is Goal & { mode: 'lose' | 'gain' } {
  return !!goal && goal.mode !== 'maintain';
}

/** The direction that counts as progress: up for a gain goal, down otherwise. */
export function goodDirection(goal: Goal | null): 'down' | 'up' {
  return goal?.mode === 'gain' ? 'up' : 'down';
}

/** The goal in force (the one not yet ended), or null. */
export function currentGoal(goals: Goal[]): Goal | null {
  for (let i = goals.length - 1; i >= 0; i--) {
    if (goals[i].endedOn === null) return goals[i];
  }
  return null;
}

/** Build a goal from the form values. */
export function makeGoal(
  mode: GoalMode,
  values: { target?: number; low?: number; high?: number },
  setOn: string,
): Goal {
  if (mode !== 'maintain') {
    const target = roundWeight(values.target ?? 0);
    return { mode, target, low: target, high: target, setOn, endedOn: null };
  }
  const low = roundWeight(Math.min(values.low ?? 0, values.high ?? 0));
  const high = roundWeight(Math.max(values.low ?? 0, values.high ?? 0));
  return {
    mode,
    target: roundWeight((low + high) / 2),
    low,
    high,
    setOn,
    endedOn: null,
  };
}

/**
 * Replace the current goal with `next` (or remove it when `next` is null).
 * A goal set earlier the same day is overwritten rather than kept, so a typo
 * fixed straight away does not pollute the history.
 */
export function replaceGoal(goals: Goal[], next: Goal | null, today: string): Goal[] {
  const out = goals.slice();
  const idx = out.findIndex((g) => g.endedOn === null);
  if (idx >= 0) {
    if (out[idx].setOn === today) out.splice(idx, 1);
    else out[idx] = { ...out[idx], endedOn: today };
  }
  if (next) out.push({ ...next, setOn: today, endedOn: null });
  return out;
}

/** The latest weigh-in on or before an ISO date, or null. */
export function weightOnOrBefore(entries: WeightEntry[], iso: string): number | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].date <= iso) return entries[i].weight;
  }
  return null;
}

/**
 * Older saves had one `reach` mode for both directions. It becomes `lose`
 * when the target was below the weight on the day it was set, else `gain`.
 */
export function normalizeGoal(
  goal: StoredGoal,
  entries: WeightEntry[],
): Goal {
  if (goal.mode !== 'reach') return { ...goal, mode: goal.mode, endedOn: goal.endedOn ?? null };
  const base = weightOnOrBefore(entries, goal.setOn) ?? entries[0]?.weight;
  const mode: GoalMode = base == null || base > goal.target ? 'lose' : 'gain';
  return { ...goal, mode, endedOn: goal.endedOn ?? null };
}

/**
 * Upgrade an older save: convert `reach` goals, or turn a lone `goalWeight`
 * into a goal set on the first weigh-in's date.
 */
export function migrateGoals(
  goals: StoredGoal[] | undefined | null,
  goalWeight: number | null | undefined,
  entries: WeightEntry[],
): Goal[] {
  if (Array.isArray(goals)) return goals.map((g) => normalizeGoal(g, entries));
  if (goalWeight == null) return [];
  const setOn = entries[0]?.date ?? '1970-01-01';
  return [normalizeGoal({ ...makeGoal('lose', { target: goalWeight }, setOn), mode: 'reach' }, entries)];
}

/** The single weight older clients read: the target, or a range's ceiling. */
export function legacyGoalWeight(goal: Goal | null): number | null {
  if (!goal) return null;
  return isTargetGoal(goal) ? goal.target : goal.high;
}

/**
 * The first weigh-in, between the day the goal was set and the day it ended,
 * that passed a target goal: strictly below it for a loss, above for a gain.
 */
export function goalReachedOn(goal: Goal, entries: WeightEntry[]): WeightEntry | null {
  if (!isTargetGoal(goal)) return null;
  const until = goal.endedOn ?? '9999-12-31';
  for (const e of entries) {
    if (e.date < goal.setOn || e.date > until) continue;
    if (goal.mode === 'lose' ? e.weight < goal.target : e.weight > goal.target) return e;
  }
  return null;
}

/**
 * The most recent target goal that was passed, with the day it happened. Used
 * while maintaining to say how long the weight has stayed past that target.
 */
export function lastReachedTarget(
  goals: Goal[],
  entries: WeightEntry[],
): { goal: Goal; reached: WeightEntry } | null {
  for (let i = goals.length - 1; i >= 0; i--) {
    const g = goals[i];
    if (!isTargetGoal(g)) continue;
    const reached = goalReachedOn(g, entries);
    if (reached) return { goal: g, reached };
  }
  return null;
}

/** Remove one goal from the history (any of them, the current one included). */
export function deleteGoalAt(goals: Goal[], index: number): Goal[] {
  return goals.filter((_, i) => i !== index);
}

export type GoalDatesError = 'order' | 'future' | 'overlap';

/**
 * Change when a goal started and, for a past goal, when it ended. The current
 * goal keeps no end date. Periods may touch (one ends the day the next
 * starts, as when a goal replaces another) but must not overlap. The history
 * stays sorted by start date.
 */
export function editGoalDates(
  goals: Goal[],
  index: number,
  setOn: string,
  endedOn: string | null,
  today: string,
): { goals: Goal[] } | { error: GoalDatesError; other?: Goal } {
  const g = goals[index];
  const end = g.endedOn === null ? null : endedOn;
  if (setOn > today || (end && end > today)) return { error: 'future' };
  if (end && end < setOn) return { error: 'order' };
  const until = (x: { endedOn: string | null }) => x.endedOn ?? '9999-12-31';
  const mine = { setOn, endedOn: end };
  for (let i = 0; i < goals.length; i++) {
    if (i === index) continue;
    const o = goals[i];
    if (mine.setOn < until(o) && o.setOn < until(mine)) return { error: 'overlap', other: o };
  }
  const out = goals.map((x, i) => (i === index ? { ...x, setOn, endedOn: end } : x));
  out.sort((a, b) => (a.setOn < b.setOn ? -1 : a.setOn > b.setOn ? 1 : 0));
  return { goals: out };
}
