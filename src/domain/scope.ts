import { MA_WINDOW } from '@/lib/constants';
import { addDaysISO, daysBetween } from './calendar';
import { goodDirection } from './goals';
import { rangeBounds } from './range';
import type { CustomRange, Goal, RangeKey, ScopeKey, WeightEntry } from '@/types';

/**
 * What the Today screen covers. A goal that reverses direction (a cut, then a
 * bulk) starts a new stretch of history: progress, pace and colours only make
 * sense inside it. A scope is one such stretch with the direction that counts
 * as progress in it:
 *
 * - `current`: since the goal in force was set (the default);
 * - `past`: one earlier goal, frozen on the day it ended;
 * - `all`: the whole history, where a loss counts as progress.
 *
 * Goals in a row that share a direction (lose to 80, then lose to 75) are one
 * phase, measured from the first one's start: only a change of direction, a
 * maintain goal or a gap without a goal starts a new one.
 */

/** Which way is progress; `null` when neither is (maintaining a range). */
export type Good = 'down' | 'up' | null;

const OPEN = '9999-12-31';

/** A goal's identity (goals carry no id): its start, kind and weights. */
export function goalKey(g: Goal): string {
  return `${g.setOn}|${g.mode}|${g.low}|${g.high}`;
}

export interface GoalPhase {
  /** `goalKey` of its first goal. */
  key: string;
  /** Its goals, oldest first. */
  goals: Goal[];
  /** The last one: its target or range is what the phase aimed for. */
  goal: Goal;
  from: string;
  /** The day it ended; `null` while it is the goal in force. */
  to: string | null;
  current: boolean;
}

const byStart = (goals: Goal[]) => [...goals].sort((a, b) => (a.setOn < b.setOn ? -1 : a.setOn > b.setOn ? 1 : 0));

/** The goal history as phases, oldest first. */
export function goalPhases(goals: Goal[]): GoalPhase[] {
  const out: GoalPhase[] = [];
  for (const g of byStart(goals)) {
    const last = out[out.length - 1];
    const prev = last?.goal;
    const joins =
      prev != null &&
      prev.endedOn != null &&
      prev.mode !== 'maintain' &&
      prev.mode === g.mode &&
      g.setOn <= addDaysISO(prev.endedOn, 1);
    if (last && joins) {
      last.goals.push(g);
      // The phase ends with whichever goal ends last (a goal re-dated to a
      // single day must not cut the phase short), and is judged by that goal.
      if (g.endedOn === null || (last.to !== null && g.endedOn >= last.to)) {
        last.goal = g;
        last.to = g.endedOn;
        last.current = g.endedOn === null;
      }
    } else {
      out.push({ key: goalKey(g), goals: [g], goal: g, from: g.setOn, to: g.endedOn, current: g.endedOn === null });
    }
  }
  return out;
}

export interface Scope {
  kind: 'current' | 'past' | 'all';
  /** The key after fallbacks (a deleted goal resolves to `current`, no goal to `all`). */
  key: ScopeKey;
  phase: GoalPhase | null;
  /** The goal the scope is judged by; `null` for `all`. */
  goal: Goal | null;
  /** A past goal: nothing in it moves any more. */
  closed: boolean;
  from: string | null;
  to: string | null;
  /** The day the scope is read on: today, or the day a past goal ended. */
  asOf: string;
  good: Good;
  /**
   * The weigh-ins the scope's figures use: the baseline, then every weigh-in
   * up to the scope's end. The day two goals meet belongs to both: it is the
   * last weigh-in of the old one and the baseline of the new one.
   */
  entries: WeightEntry[];
  /** Where the scope starts from; `null` without any weigh-in to start from. */
  baseline: WeightEntry | null;
  /** Whether a goal is in force at all (even when the scope is `all`). */
  hasCurrentGoal: boolean;
}

/**
 * The weigh-in a phase starts from: the latest one on its first day or in the
 * week before it; else its own first weigh-in; else, with none inside it, the
 * latest one before it of any age.
 */
export function scopeBaseline(from: string, to: string | null, entries: WeightEntry[]): WeightEntry | null {
  const end = to ?? OPEN;
  const earliest = addDaysISO(from, -MA_WINDOW);
  let before: WeightEntry | null = null;
  let inside: WeightEntry | null = null;
  for (const e of entries) {
    if (e.date <= from) before = e;
    else if (e.date <= end && !inside) inside = e;
  }
  if (before && before.date >= earliest) return before;
  return inside ?? before;
}

/** Resolve a stored scope key against the goal history and the weigh-ins. */
export function resolveScope(key: ScopeKey, goals: Goal[], entries: WeightEntry[], today: string): Scope {
  const phases = goalPhases(goals);
  const current = phases.find((p) => p.current) ?? null;
  let phase: GoalPhase | null = null;
  if (key === 'current') phase = current;
  else if (key !== 'all') phase = phases.find((p) => `g:${p.key}` === key) ?? current;

  if (!phase) {
    return {
      kind: 'all',
      key: 'all',
      phase: null,
      goal: null,
      closed: false,
      from: entries[0]?.date ?? null,
      to: null,
      asOf: today,
      good: 'down',
      entries,
      baseline: entries[0] ?? null,
      hasCurrentGoal: current != null,
    };
  }

  const end = phase.to ?? OPEN;
  let baseline = scopeBaseline(phase.from, phase.to, entries);
  let inScope = baseline ? entries.filter((e) => e.date >= baseline!.date && e.date <= end) : [];
  // An earlier goal with no weigh-in inside its dates has nothing of its own:
  // the weigh-in before it is not shown as if it were.
  if (!phase.current && inScope.length > 0 && inScope[inScope.length - 1].date < phase.from) {
    baseline = null;
    inScope = [];
  }
  return {
    kind: phase.current ? 'current' : 'past',
    key: phase.current ? 'current' : `g:${phase.key}`,
    phase,
    goal: phase.goal,
    closed: !phase.current,
    from: phase.from,
    to: phase.to,
    asOf: phase.to ?? today,
    good: phase.goal.mode === 'maintain' ? null : goodDirection(phase.goal),
    entries: inScope,
    baseline,
    hasCurrentGoal: current != null,
  };
}

export interface ScopeOption {
  key: ScopeKey;
  /** `null` for the whole history. */
  phase: GoalPhase | null;
}

/** The choices: the goal in force, earlier goals newest first, everything. None without goals. */
export function scopeOptions(goals: Goal[]): ScopeOption[] {
  const phases = goalPhases(goals);
  if (phases.length === 0) return [];
  const current = phases.find((p) => p.current);
  const past = phases.filter((p) => !p.current).reverse();
  return [
    ...(current ? [{ key: 'current' as ScopeKey, phase: current }] : []),
    ...past.map((p) => ({ key: `g:${p.key}` as ScopeKey, phase: p })),
    { key: 'all' as ScopeKey, phase: null },
  ];
}

/**
 * The goal in force on a day. On the day two goals meet, `earlier` gives the
 * one that ended and `later` the one that started.
 */
export function goalAt(goals: Goal[], date: string, prefer: 'earlier' | 'later' = 'earlier'): Goal | null {
  const covering = byStart(goals).filter((g) => g.setOn <= date && date <= (g.endedOn ?? OPEN));
  if (covering.length === 0) return null;
  return prefer === 'earlier' ? covering[0] : covering[covering.length - 1];
}

const dirOf = (g: Goal | null): Good => (g == null ? 'down' : g.mode === 'maintain' ? null : goodDirection(g));

/**
 * Which way is progress for a change between two dates: the direction of the
 * goal in force over that span. With no goal a loss counts as progress; while
 * maintaining, or when the span crosses a change of direction, neither does
 * (`null`), so the change is shown without a verdict.
 */
export function spanDirection(goals: Goal[], from: string, to: string): Good {
  if (from >= to) return dirOf(goalAt(goals, to, 'earlier'));
  const dirs = new Set<Good>();
  // Walk the goals that overlap the span; a stretch with no goal in it counts
  // as "a loss is progress", so months without a goal followed by a bulk get
  // no verdict rather than the bulk's.
  let covered = from;
  for (const g of byStart(goals)) {
    const end = g.endedOn ?? OPEN;
    if (!(g.setOn < to && end > from)) continue;
    if (g.setOn > addDaysISO(covered, 1)) dirs.add('down');
    dirs.add(dirOf(g));
    if (end > covered) covered = end;
  }
  // Goals a day apart count as joined (as in goalPhases): a goal that starts
  // on the span's last day, the day after the one before it ended, covers it.
  const next = goals.find((g) => g.setOn === to && to <= addDaysISO(covered, 1) && covered < to);
  if (next) {
    dirs.add(dirOf(next));
    covered = to;
  }
  if (covered < to) dirs.add('down');
  return dirs.size === 1 ? [...dirs][0] : null;
}

/** The direction for a dated change inside a scope: a loss in `all`, else by the goal in force. */
export function changeDirection(scope: Pick<Scope, 'kind'>, goals: Goal[], from: string, to: string): Good {
  return scope.kind === 'all' ? 'down' : spanDirection(goals, from, to);
}

export interface GoalMark {
  goal: Goal;
  from: string;
  to: string;
}

/** Each goal clipped to the visible dates, for the chart's goal lines and bands. */
export function goalMarks(goals: Goal[], from: string, to: string): GoalMark[] {
  const out: GoalMark[] = [];
  for (const g of byStart(goals)) {
    const a = g.setOn > from ? g.setOn : from;
    const end = g.endedOn ?? OPEN;
    const b = end < to ? end : to;
    // The goal in force set on the last day shown has no span yet but is
    // still marked (the chart draws it across the plot); an ended one needs a span.
    if (a < b || (a === b && g.endedOn === null)) out.push({ goal: g, from: a, to: b });
  }
  return out;
}

/**
 * The dates the range buttons cover inside a scope, anchored on its last
 * weigh-in. `null` is everything the scope holds. A preset is clamped to the
 * scope's start ("90 days" of a goal two weeks old is those two weeks); dates
 * picked by hand that fall outside the scope count as everything.
 */
export function scopeRangeBounds(
  scope: Pick<Scope, 'entries'>,
  range: RangeKey,
  custom?: CustomRange | null,
): CustomRange | null {
  const pts = scope.entries;
  if (pts.length === 0) return null;
  const b = rangeBounds(pts, range, custom);
  const first = pts[0].date;
  const last = pts[pts.length - 1].date;
  if (!b || b.to < first || b.from > last) return null;
  if (range === 'custom') {
    // Dates that only touch the scope's first day belong to the goal before it.
    return b.to <= first && first < last ? null : b;
  }
  return { from: b.from < first ? first : b.from, to: b.to };
}

/**
 * Keep the earlier goal being viewed when the goal history is replaced (its
 * dates edited, an undo, a sync from another device): the same key if it
 * still exists, else the earlier goal of the same kind that overlaps where it
 * was. `null` when it is gone, and the view should return to the goal in force.
 */
export function remapScopeKey(key: ScopeKey, before: Goal[], after: Goal[]): ScopeKey | null {
  if (key === 'current' || key === 'all') return key;
  const next = goalPhases(after).filter((p) => !p.current);
  if (next.some((p) => `g:${p.key}` === key)) return key;
  const old = goalPhases(before).find((p) => `g:${p.key}` === key);
  if (!old) return null;
  const oldEnd = old.to ?? OPEN;
  const same = next.filter((p) => p.goal.mode === old.goal.mode);
  // Best first: the same start or end; then the most days in common; a phase
  // that only touches the old one (the goal before or after it) comes last.
  const shared = (p: GoalPhase) => {
    const a = p.from > old.from ? p.from : old.from;
    const b = (p.to ?? OPEN) < oldEnd ? (p.to ?? OPEN) : oldEnd;
    return a < b ? daysBetween(a, b === OPEN ? a : b) + 1 : a === b ? 0 : -1;
  };
  const match =
    same.find((p) => p.from === old.from || (p.to ?? OPEN) === oldEnd) ??
    same
      .map((p) => ({ p, days: shared(p) }))
      .filter((x) => x.days >= 0)
      .sort((x, y) => y.days - x.days)[0]?.p;
  return match ? `g:${match.key}` : null;
}
