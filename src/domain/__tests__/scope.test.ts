import { describe, expect, it } from 'vitest';
import {
  buildInsights,
  buildStatus,
  changeDirection,
  goalAt,
  goalKey,
  goalMarks,
  goalPhases,
  makeGoal,
  migrateGoals,
  paceState,
  remapScopeKey,
  resolveScope,
  sameGoal,
  scopeBaseline,
  scopeOptions,
  scopeRangeBounds,
  spanDirection,
  weeklyPeriods,
  withGoalValues,
} from '@/domain';
import type { Goal, ScopeKey, WeightEntry } from '@/types';

/**
 * The owner's case: a cut to 75 kg that ended on 7 Nov 2026 (74.6 kg that
 * morning) and a bulk to 78 kg set the same day. Weigh-ins are the real ones
 * around the change, plus the very first.
 */
const TODAY = '2026-11-13';
const cut: Goal = { ...makeGoal('lose', { target: 75 }, '2026-04-18'), endedOn: '2026-11-07' };
const bulk: Goal = makeGoal('gain', { target: 78 }, '2026-11-07');
const goals = [cut, bulk];
const entries: WeightEntry[] = [
  { date: '2026-04-18', weight: 86.1 },
  { date: '2026-10-20', weight: 76.5 },
  { date: '2026-10-31', weight: 76.0 },
  { date: '2026-11-01', weight: 76.5 },
  { date: '2026-11-02', weight: 75.7 },
  { date: '2026-11-04', weight: 75.9 },
  { date: '2026-11-06', weight: 75.9 },
  { date: '2026-11-07', weight: 74.6 },
  { date: '2026-11-08', weight: 75.7 },
  { date: '2026-11-09', weight: 74.9 },
  { date: '2026-11-10', weight: 75.2 },
  { date: '2026-11-11', weight: 75.6 },
  { date: '2026-11-12', weight: 76.1 },
];
const PAST: ScopeKey = `g:${goalKey(cut)}`;

describe('goal phases', () => {
  it('a change of direction starts a new phase', () => {
    const p = goalPhases(goals);
    expect(p.map((x) => [x.from, x.to, x.goal.mode, x.current])).toEqual([
      ['2026-04-18', '2026-11-07', 'lose', false],
      ['2026-11-07', null, 'gain', true],
    ]);
  });

  it('goals in a row with the same direction are one phase, judged by the last', () => {
    const a = { ...makeGoal('lose', { target: 80 }, '2026-04-18'), endedOn: '2026-07-12' };
    const b = makeGoal('lose', { target: 75 }, '2026-07-12');
    const p = goalPhases([a, b]);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ from: '2026-04-18', to: null, current: true, key: goalKey(a) });
    expect(p[0].goal.target).toBe(75);
  });

  it('a maintain goal and a gap each start a new phase', () => {
    const a = { ...makeGoal('lose', { target: 80 }, '2026-04-18'), endedOn: '2026-07-12' };
    expect(goalPhases([a, makeGoal('maintain', { low: 78, high: 80 }, '2026-07-12')])).toHaveLength(2);
    expect(goalPhases([a, makeGoal('lose', { target: 75 }, '2026-07-20')])).toHaveLength(2);
  });
});

describe('resolveScope', () => {
  it('current: the bulk since 7 Nov, starting from that morning', () => {
    const sc = resolveScope('current', goals, entries, TODAY);
    expect(sc).toMatchObject({ kind: 'current', key: 'current', good: 'up', from: '2026-11-07', to: null, closed: false });
    expect(sc.baseline).toEqual({ date: '2026-11-07', weight: 74.6 });
    expect(sc.entries.map((e) => e.date)).toEqual([
      '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12',
    ]);
  });

  it('past: the cut, frozen on the day it ended (the boundary day belongs to both)', () => {
    const sc = resolveScope(PAST, goals, entries, TODAY);
    expect(sc).toMatchObject({ kind: 'past', key: PAST, good: 'down', closed: true, to: '2026-11-07', asOf: '2026-11-07' });
    expect(sc.baseline).toEqual({ date: '2026-04-18', weight: 86.1 });
    expect(sc.entries[sc.entries.length - 1]).toEqual({ date: '2026-11-07', weight: 74.6 });
  });

  it('all: the whole history, a loss is progress', () => {
    const sc = resolveScope('all', goals, entries, TODAY);
    expect(sc).toMatchObject({ kind: 'all', good: 'down', goal: null, hasCurrentGoal: true });
    expect(sc.entries).toHaveLength(entries.length);
  });

  it('falls back: a deleted goal shows the current one, no goal shows everything', () => {
    expect(resolveScope('g:gone', goals, entries, TODAY).key).toBe('current');
    expect(resolveScope('current', [], entries, TODAY).kind).toBe('all');
    expect(resolveScope('current', [cut], entries, TODAY).kind).toBe('all');
    // The key of the goal in force is just "current".
    expect(resolveScope(`g:${goalKey(bulk)}`, goals, entries, TODAY).key).toBe('current');
  });

  it('a maintain scope has no good direction', () => {
    const m = makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07');
    expect(resolveScope('current', [cut, m], entries, TODAY).good).toBeNull();
  });

  it('lists the choices: current, earlier goals newest first, everything', () => {
    expect(scopeOptions(goals).map((o) => o.key)).toEqual(['current', PAST, 'all']);
    expect(scopeOptions([])).toEqual([]);
    expect(scopeOptions([cut]).map((o) => o.key)).toEqual([PAST, 'all']);
  });
});

describe('scope baseline', () => {
  const e = (date: string, weight = 80): WeightEntry => ({ date, weight });
  it('the weigh-in on the first day, or the latest in the week before it', () => {
    expect(scopeBaseline('2026-11-07', null, [e('2026-11-05'), e('2026-11-09')])?.date).toBe('2026-11-05');
    expect(scopeBaseline('2026-11-07', null, [e('2026-11-07'), e('2026-11-09')])?.date).toBe('2026-11-07');
  });
  it('else the first weigh-in inside; else the latest before, of any age', () => {
    expect(scopeBaseline('2026-11-07', null, [e('2026-10-10'), e('2026-11-09')])?.date).toBe('2026-11-09');
    expect(scopeBaseline('2026-11-07', null, [e('2026-10-10')])?.date).toBe('2026-10-10');
    expect(scopeBaseline('2026-11-07', null, [])).toBeNull();
  });
  it('ignores weigh-ins after the scope ended', () => {
    expect(scopeBaseline('2026-01-01', '2026-01-31', [e('2026-03-01')])).toBeNull();
  });
});

describe('the direction of a dated change', () => {
  it('follows the goal in force; the boundary day closes the old goal', () => {
    expect(spanDirection(goals, '2026-11-06', '2026-11-07')).toBe('down');
    expect(spanDirection(goals, '2026-11-07', '2026-11-08')).toBe('up');
    expect(goalAt(goals, '2026-11-07', 'earlier')).toBe(cut);
    expect(goalAt(goals, '2026-11-07', 'later')).toBe(bulk);
  });
  it('gives no verdict across a change of direction, or while maintaining', () => {
    expect(spanDirection(goals, '2026-11-06', '2026-11-08')).toBeNull();
    expect(spanDirection(goals, '2026-11-02', '2026-11-13')).toBeNull();
    const m = makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07');
    expect(spanDirection([cut, m], '2026-11-08', '2026-11-09')).toBeNull();
  });
  it('counts a loss as progress where there is no goal', () => {
    expect(spanDirection(goals, '2026-01-01', '2026-01-10')).toBe('down');
    expect(spanDirection([], '2026-11-06', '2026-11-08')).toBe('down');
  });
  it('is a loss for everything when the whole history is shown', () => {
    expect(changeDirection({ kind: 'all' }, goals, '2026-11-07', '2026-11-08')).toBe('down');
    expect(changeDirection({ kind: 'current' }, goals, '2026-11-07', '2026-11-08')).toBe('up');
  });
});

describe('goal marks for the chart', () => {
  it('draws each goal over its own dates only', () => {
    expect(goalMarks(goals, '2026-04-18', '2026-11-12').map((m) => [m.goal.target, m.from, m.to])).toEqual([
      [75, '2026-04-18', '2026-11-07'],
      [78, '2026-11-07', '2026-11-12'],
    ]);
    expect(goalMarks(goals, '2026-11-01', '2026-11-12')[0]).toMatchObject({ from: '2026-11-01', to: '2026-11-07' });
    expect(goalMarks(goals, '2026-05-01', '2026-06-01').map((m) => m.goal.target)).toEqual([75]);
  });
});

describe('buildStatus inside a scope', () => {
  it('current (the bulk): progress and totals start on 7 Nov', () => {
    const s = buildStatus(entries, goals, TODAY);
    expect(s.scope).toMatchObject({ kind: 'current', good: 'up', from: '2026-11-07' });
    expect(s.phase).toBe('reach');
    expect(s.latest).toEqual({ date: '2026-11-12', weight: 76.1 });
    expect(s.first).toEqual({ date: '2026-11-07', weight: 74.6 });
    expect(s.sinceStart).toBe(1.5);
    expect(s.toGo).toBe(1.9);
    expect(s.journeyStart?.weight).toBe(74.6);
    expect(s.progress).toBeCloseTo((1.5 / 3.4) * 100, 5);
    // Six weigh-ins over five days: no pace yet, and it says since when.
    expect(s.rate).toBeNull();
    expect(s.rateSince).toBe('2026-11-07');
    expect(s.projection).toBeNull();
    expect(s.closed).toBeNull();
  });

  it('week and month stay calendar levels of the whole history, without a verdict across the change', () => {
    const s = buildStatus(entries, goals, TODAY);
    // 9–12 Nov against the whole week of 2–8 Nov (four of its five weigh-ins are from the cut).
    expect(s.week).toMatchObject({ start: '2026-11-09', avg: 75.5, count: 4, prevAvg: 75.6, prevCount: 5, delta: -0.1, good: null });
    expect(s.month).toMatchObject({ start: '2026-11-01', avg: 75.6, count: 10, good: null });
    // Once both weeks lie inside the bulk the change is judged by it.
    const later = [...entries, { date: '2026-11-17', weight: 76.4 }];
    expect(buildStatus(later, goals, '2026-11-18').week).toMatchObject({ start: '2026-11-16', good: 'up' });
  });

  it('the 7-day average of a scope never carries the weigh-ins before it', () => {
    // 7 Nov: only that morning's 74.6 is in the bulk.
    const upTo7 = entries.filter((e) => e.date <= '2026-11-07');
    expect(buildStatus(upTo7, goals, '2026-11-07').avg7).toBe(74.6);
    expect(buildStatus(upTo7, goals, '2026-11-07', 'all').avg7).toBe(75.7);
  });

  it('past (the cut): frozen on 7 Nov, a loss is progress', () => {
    const s = buildStatus(entries, goals, TODAY, PAST);
    expect(s.scope).toMatchObject({ kind: 'past', closed: true, good: 'down' });
    expect(s.latest).toEqual({ date: '2026-11-07', weight: 74.6 });
    expect(s.sinceStart).toBe(-11.5);
    expect(s.phase).toBe('reached');
    expect(s.reached?.date).toBe('2026-11-07');
    expect(s.week).toBeNull();
    expect(s.month).toBeNull();
    expect(s.projection).toBeNull();
    expect(s.stay).toBeNull();
    expect(s.closed?.days).toBe(203);
    expect(s.closed?.avgRate).toBeCloseTo(-11.5 / (203 / 7), 5);
    expect(s.closed?.short).toBeNull();
  });

  it('a past goal that ended before its target says how far short', () => {
    const short = { ...makeGoal('lose', { target: 74 }, '2026-04-18'), endedOn: '2026-11-07' };
    const s = buildStatus(entries, [short, bulk], TODAY, `g:${goalKey(short)}`);
    expect(s.phase).toBe('reach');
    expect(s.closed?.short).toBe(0.6);
  });

  it('all: the whole history, judged as a loss', () => {
    const s = buildStatus(entries, goals, TODAY, 'all');
    expect(s.scope).toMatchObject({ kind: 'all', good: 'down', hasCurrentGoal: true });
    expect(s.phase).toBe('none');
    expect(s.goal).toBeNull();
    expect(s.sinceStart).toBe(-10);
    expect(s.first?.weight).toBe(86.1);
    expect(s.week).toMatchObject({ delta: -0.1, good: 'down' });
    expect(s.rateSince).toBeNull();
  });

  it('a goal set after the last weigh-in starts from that weigh-in', () => {
    const fresh = [{ ...bulk, endedOn: '2026-11-13' }, makeGoal('lose', { target: 74 }, '2026-11-13')];
    const s = buildStatus(entries, [cut, ...fresh], TODAY);
    expect(s.phase).toBe('reach');
    expect(s.latest).toEqual({ date: '2026-11-12', weight: 76.1 });
    expect(s.sinceStart).toBeNull();
  });

  it('holds back the arrival date until the goal has two weeks of its own', () => {
    const rising = (days: number): WeightEntry[] =>
      Array.from({ length: days }, (_, i) => ({
        date: `2026-11-${String(7 + i).padStart(2, '0')}`,
        weight: Math.round((74.6 + i * 0.1) * 10) / 10,
      }));
    const at = (days: number) => buildStatus(rising(days), [bulk], `2026-11-${String(6 + days).padStart(2, '0')}`);
    expect(at(10).rate).toBeGreaterThan(0);
    expect(at(10).projection).toBeNull();
    expect(at(16).projection).not.toBeNull();
  });

  it('maintaining after a cut: no "days below" for a target under the range', () => {
    const m = makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07');
    // Back under the old 75 kg target: still nothing to say about "below 75".
    const dipped = [...entries.slice(0, -1), { date: '2026-11-12', weight: 74.8 }];
    const s = buildStatus(dipped, [cut, m], TODAY);
    expect(s.phase).toBe('maintain');
    expect(s.stay).toBeNull();
    expect(s.scope.good).toBeNull();
  });

  it('maintaining under a passed target: counts the days below it', () => {
    const to80 = { ...makeGoal('lose', { target: 80 }, '2026-04-18'), endedOn: '2026-11-07' };
    const m = makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07');
    const s = buildStatus(entries, [to80, m], TODAY);
    expect(s.stay).toMatchObject({ threshold: 80, side: 'below', since: '2026-10-20' });
    expect(s.reached?.date).toBe('2026-10-20');
  });

  it('maintaining with no earlier target: counts the days under the top of the range', () => {
    const m = makeGoal('maintain', { low: 74, high: 77 }, '2026-10-20');
    const s = buildStatus(entries, [m], TODAY);
    expect(s.stay).toMatchObject({ threshold: 77, side: 'below', since: '2026-10-20' });
  });

  it('a past goal that was passed and then drifted back ended short of it', () => {
    const g = { ...makeGoal('lose', { target: 75 }, '2026-01-01'), endedOn: '2026-02-10' };
    const es = [
      { date: '2026-01-01', weight: 80 },
      { date: '2026-01-20', weight: 74.9 },
      { date: '2026-02-10', weight: 76.5 },
    ];
    const s = buildStatus(es, [g, makeGoal('gain', { target: 78 }, '2026-02-10')], '2026-03-01', `g:${goalKey(g)}`);
    expect(s.phase).toBe('reached');
    expect(s.reached?.date).toBe('2026-01-20');
    expect(s.closed?.short).toBe(1.5);
  });

  it('a past goal with no weigh-in inside its dates has nothing to show', () => {
    const g = { ...makeGoal('lose', { target: 75 }, '2026-02-01'), endedOn: '2026-02-10' };
    const es = [
      { date: '2026-01-01', weight: 80 },
      { date: '2026-03-05', weight: 79 },
    ];
    const s = buildStatus(es, [g, makeGoal('gain', { target: 82 }, '2026-03-01')], '2026-03-06', `g:${goalKey(g)}`);
    expect(s.phase).toBe('none');
    expect(s.latest).toBeNull();
    expect(s.closed).toBeNull();
  });

  it('gives no arrival date while the pace heads away from the target', () => {
    const run = (step: number): WeightEntry[] =>
      Array.from({ length: 20 }, (_, i) => ({
        date: `2026-11-${String(7 + i).padStart(2, '0')}`,
        weight: Math.round((76 + i * step) * 10) / 10,
      }));
    const falling = buildStatus(run(-0.05), [bulk], '2026-11-26');
    expect(falling.rate).toBeLessThan(0);
    expect(falling.projection).toBeNull();
    const lose = makeGoal('lose', { target: 74 }, '2026-11-07');
    const rising = buildStatus(run(0.05), [lose], '2026-11-26');
    expect(rising.rate).toBeGreaterThan(0);
    expect(rising.projection).toBeNull();
    // And the right way round it does.
    expect(buildStatus(run(0.05), [bulk], '2026-11-26').projection).not.toBeNull();
  });
});

describe('insights inside a scope', () => {
  const rising: WeightEntry[] = Array.from({ length: 45 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 10, 7 + i));
    return { date: d.toISOString().slice(0, 10), weight: Math.round((74.6 + i * 0.07) * 10) / 10 };
  });

  it('a gain goal gets the gain sentences, in green', () => {
    const list = buildInsights({ entries: rising, goal: bulk, good: 'up' });
    const win = list.find((i) => i.id === 'window');
    expect(win?.tone).toBe('good');
    expect(win?.text).toMatch(/gained/);
    const cons = list.find((i) => i.id === 'consistency');
    expect(cons?.tone).toBe('good');
    expect(cons?.text).toMatch(/increased/);
    expect(list.find((i) => i.id === 'best')?.text).toMatch(/up/);
  });

  it('the same history judged as a loss is red', () => {
    expect(buildInsights({ entries: rising, goal: null, good: 'down' }).find((i) => i.id === 'window')?.tone).toBe('bad');
  });

  it('a few days into a goal says nothing about the goal before it', () => {
    const sc = resolveScope('current', goals, entries, TODAY);
    const ids = buildInsights({ entries: sc.entries, goal: sc.goal, good: sc.good, allEntries: entries }).map((i) => i.id);
    expect(ids).not.toContain('window');
    expect(ids).not.toContain('best');
    expect(ids).not.toContain('accel');
  });

  it('a past goal keeps only what does not speak of "now"', () => {
    const sc = resolveScope(PAST, goals, entries, TODAY);
    const ids = buildInsights({ entries: sc.entries, goal: sc.goal, good: sc.good, closed: true, allEntries: entries }).map((i) => i.id);
    for (const id of ids) expect(['best', 'category', 'weekday']).toContain(id);
  });
});

describe('edge cases found in review', () => {
  it('time without a goal inside a span is its own direction', () => {
    const gain = makeGoal('gain', { target: 80 }, '2026-06-01');
    // Months without a goal, then a bulk: no verdict, not the bulk's.
    expect(spanDirection([gain], '2026-03-01', '2026-06-02')).toBeNull();
    expect(spanDirection([gain], '2026-03-01', '2026-06-01')).toBe('down');
    // No goal then a cut agree: a loss is progress in both.
    expect(spanDirection([makeGoal('lose', { target: 70 }, '2026-06-01')], '2026-03-01', '2026-06-10')).toBe('down');
    // A gap between a cut and a bulk does not hide the change of direction.
    const early = { ...makeGoal('lose', { target: 75 }, '2026-01-01'), endedOn: '2026-02-01' };
    expect(spanDirection([early, gain], '2026-01-10', '2026-06-10')).toBeNull();
    // A span that outlives an ended goal runs into time without one.
    expect(spanDirection([{ ...gain, endedOn: '2026-07-01' }], '2026-06-10', '2026-08-01')).toBeNull();
  });

  it('a goal re-dated to a single day does not cut its phase short', () => {
    const a = { ...makeGoal('lose', { target: 80 }, '2026-02-01'), endedOn: '2026-03-01' };
    const b = { ...makeGoal('lose', { target: 82 }, '2026-02-01'), endedOn: '2026-02-01' };
    const p = goalPhases([a, b, makeGoal('gain', { target: 85 }, '2026-04-01')]);
    expect(p[0]).toMatchObject({ from: '2026-02-01', to: '2026-03-01' });
    expect(p[0].goal.target).toBe(80);
  });

  it('the goal in force is marked even on its first day', () => {
    expect(goalMarks([bulk], '2026-11-07', '2026-11-07')).toEqual([{ goal: bulk, from: '2026-11-07', to: '2026-11-07' }]);
    // A goal that starts after the dates shown is not on the chart.
    expect(goalMarks([makeGoal('lose', { target: 74 }, '2026-11-13')], '2026-11-07', '2026-11-12')).toEqual([]);
    // An ended goal needs a span.
    expect(goalMarks([cut], '2026-11-07', '2026-11-12')).toEqual([]);
  });

  it('range buttons stay inside the scope', () => {
    const sc = resolveScope('current', goals, entries, TODAY);
    expect(scopeRangeBounds(sc, '90d')).toEqual({ from: '2026-11-07', to: '2026-11-12' });
    expect(scopeRangeBounds(sc, '7d')).toEqual({ from: '2026-11-07', to: '2026-11-12' });
    expect(scopeRangeBounds(sc, 'all')).toBeNull();
    // Dates picked by hand: kept inside the scope, dropped outside it or when
    // they only touch its first day (they were picked for the goal before).
    expect(scopeRangeBounds(sc, 'custom', { from: '2026-11-08', to: '2026-11-10' })).toEqual({ from: '2026-11-08', to: '2026-11-10' });
    expect(scopeRangeBounds(sc, 'custom', { from: '2026-06-01', to: '2026-06-30' })).toBeNull();
    expect(scopeRangeBounds(sc, 'custom', { from: '2026-10-09', to: '2026-11-07' })).toBeNull();
    const all = resolveScope('all', goals, entries, TODAY);
    expect(scopeRangeBounds(all, '7d')).toEqual({ from: '2026-11-06', to: '2026-11-12' });
  });

  it('an earlier goal being viewed survives an edit of its dates', () => {
    const moved = { ...cut, setOn: '2026-04-20' };
    expect(remapScopeKey(PAST, goals, [moved, bulk])).toBe(`g:${goalKey(moved)}`);
    expect(remapScopeKey(PAST, goals, goals)).toBe(PAST);
    expect(remapScopeKey(PAST, goals, [bulk])).toBeNull();
    expect(remapScopeKey('all', goals, [])).toBe('all');
    expect(remapScopeKey('current', goals, [])).toBe('current');
  });

  it('the fastest week is one of the weekly bars: whole weeks, both inside the scope', () => {
    // A bulk from Sat 7 Nov, rising 0.1 kg a day for five weeks, after a flat week at 76.
    const before: WeightEntry[] = ['02', '03', '04', '05', '06'].map((d) => ({ date: `2026-11-${d}`, weight: 76 }));
    const during: WeightEntry[] = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 10, 7 + i));
      return { date: d.toISOString().slice(0, 10), weight: Math.round((75 + i * 0.1) * 10) / 10 };
    });
    const all = [...before, ...during];
    const best = buildInsights({ entries: during, goal: bulk, good: 'up', allEntries: all }).find((i) => i.id === 'best');
    const wp = weeklyPeriods(all);
    // Every change it may report is the difference of two whole-history week averages…
    const deltas = wp.slice(1).map((w, i) => Math.abs(w.average - wp[i].average).toFixed(1));
    expect(best).toBeDefined();
    expect(deltas.some((d) => best!.text.includes(`${d} kg`))).toBe(true);
    // …and never the week the goal began (2–8 Nov), which is mostly the goal before.
    expect(best!.text).not.toMatch(/was (2|9) Nov/);
  });
});

describe('target pace', () => {
  const run = (step: number, days = 20): WeightEntry[] =>
    Array.from({ length: days }, (_, i) => ({
      date: `2026-11-${String(7 + i).padStart(2, '0')}`,
      weight: Math.round((76 + i * step) * 100) / 100,
    }));

  it('on pace within a quarter of the target, at least 0.1 kg a week either way', () => {
    const g = makeGoal('gain', { target: 80, rate: 0.5 }, '2026-11-07');
    expect(paceState(g, 0.5)).toBe('on');
    expect(paceState(g, 0.38)).toBe('on');
    expect(paceState(g, 0.62)).toBe('on');
    expect(paceState(g, 0.3)).toBe('slow');
    expect(paceState(g, -0.2)).toBe('slow');
    expect(paceState(g, 0.8)).toBe('fast');
    // A small target still gets 0.1 kg/wk of room.
    const slow = makeGoal('gain', { target: 80, rate: 0.2 }, '2026-11-07');
    expect(paceState(slow, 0.11)).toBe('on');
    expect(paceState(slow, 0.05)).toBe('slow');
  });

  it('a goal to lose reads the pace the other way round', () => {
    const g = makeGoal('lose', { target: 70, rate: 0.5 }, '2026-11-07');
    expect(paceState(g, -0.5)).toBe('on');
    expect(paceState(g, -0.1)).toBe('slow');
    expect(paceState(g, 0.3)).toBe('slow');
    expect(paceState(g, -1)).toBe('fast');
  });

  it('no target pace, no verdict; a range has none', () => {
    expect(paceState(makeGoal('gain', { target: 80 }, '2026-11-07'), 0.5)).toBeNull();
    expect(paceState(makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07'), 0.5)).toBeNull();
    expect(makeGoal('gain', { target: 80 }, '2026-11-07')).not.toHaveProperty('rate');
    expect(makeGoal('maintain', { low: 76, high: 78, rate: 0.5 }, '2026-11-07')).not.toHaveProperty('rate');
  });

  it('buildStatus compares the pace of the goal in force with its target', () => {
    // +0.07 kg a day is about +0.49 kg a week.
    const g = makeGoal('gain', { target: 80, rate: 0.5 }, '2026-11-07');
    const s = buildStatus(run(0.07), [g], '2026-11-26');
    expect(s.rate).toBeCloseTo(0.49, 1);
    expect(s.pace).toEqual({ target: 0.5, state: 'on' });
    expect(buildStatus(run(0.02), [g], '2026-11-26').pace?.state).toBe('slow');
    expect(buildStatus(run(0.15), [g], '2026-11-26').pace?.state).toBe('fast');
    // A goal to lose carries its target as a negative pace.
    const cutting = makeGoal('lose', { target: 70, rate: 0.5 }, '2026-11-07');
    expect(buildStatus(run(-0.07), [cutting], '2026-11-26').pace).toEqual({ target: -0.5, state: 'on' });
  });

  it('too few weigh-ins: the target shows, the verdict waits', () => {
    const g = { ...bulk, rate: 0.25 };
    const s = buildStatus(entries, [cut, g], TODAY);
    expect(s.rate).toBeNull();
    expect(s.pace).toEqual({ target: 0.25, state: null });
  });

  it('no pace for a goal without a target pace, a past goal, or everything', () => {
    expect(buildStatus(entries, goals, TODAY).pace).toBeNull();
    const withRate = [{ ...cut, rate: 0.5 }, bulk];
    expect(buildStatus(entries, withRate, TODAY, `g:${goalKey(cut)}`).pace).toBeNull();
    expect(buildStatus(entries, [cut, { ...bulk, rate: 0.25 }], TODAY, 'all').pace).toBeNull();
  });
});

describe('editing a goal of the history', () => {
  it('changes target and pace, keeps kind and dates', () => {
    const g = withGoalValues(cut, { target: 74.5, rate: 0.5 });
    expect(g).toEqual({ mode: 'lose', target: 74.5, low: 74.5, high: 74.5, setOn: '2026-04-18', endedOn: '2026-11-07', rate: 0.5 });
  });
  it('an emptied pace removes it (the key is left out, never undefined)', () => {
    const g = withGoalValues({ ...bulk, rate: 0.25 }, { target: 78, rate: null });
    expect(g).not.toHaveProperty('rate');
    expect(g.endedOn).toBeNull();
  });
  it('a range keeps its dates and takes the new edges in order', () => {
    const m = { ...makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07'), endedOn: '2026-12-01' };
    expect(withGoalValues(m, { low: 77.5, high: 75 })).toMatchObject({ mode: 'maintain', low: 75, high: 77.5, setOn: '2026-11-07', endedOn: '2026-12-01' });
  });
  it('the earlier goal being viewed is followed when its target is edited', () => {
    const edited = withGoalValues(cut, { target: 74 });
    expect(remapScopeKey(PAST, goals, [edited, bulk])).toBe(`g:${goalKey(edited)}`);
  });
});

describe('second review round', () => {
  it('standing still or going the wrong way is never on pace, however small the target', () => {
    const tiny = makeGoal('lose', { target: 70, rate: 0.05 }, '2026-11-07');
    expect(paceState(tiny, 0.04)).toBe('slow');
    expect(paceState(tiny, 0)).toBe('slow');
    expect(paceState(tiny, -0.05)).toBe('on');
    const small = makeGoal('gain', { target: 80, rate: 0.1 }, '2026-11-07');
    expect(paceState(small, 0)).toBe('slow');
    expect(paceState(small, -0.02)).toBe('slow');
    expect(paceState(small, 0.1)).toBe('on');
  });

  it('the pace verdict waits for two weeks of the goal, like the arrival date', () => {
    const g = makeGoal('lose', { target: 78, rate: 0.5 }, '2026-11-07');
    const drop = (days: number): WeightEntry[] =>
      Array.from({ length: days }, (_, i) => ({
        date: `2026-11-${String(7 + i).padStart(2, '0')}`,
        weight: Math.round((85 - i * 0.2) * 10) / 10,
      }));
    const young = buildStatus(drop(9), [g], '2026-11-15');
    expect(young.rate).toBeLessThan(0);
    expect(young.pace).toEqual({ target: -0.5, state: null });
    expect(buildStatus(drop(16), [g], '2026-11-22').pace?.state).toBe('fast');
  });

  it('an edited earlier goal is followed, not the goal next to it', () => {
    const m1 = { ...makeGoal('maintain', { low: 70, high: 72 }, '2026-01-01'), endedOn: '2026-03-01' };
    const m2 = { ...makeGoal('maintain', { low: 71, high: 73 }, '2026-03-01'), endedOn: '2026-06-01' };
    const now = makeGoal('lose', { target: 68 }, '2026-06-01');
    const viewed: ScopeKey = `g:${goalKey(m2)}`;
    const wider = withGoalValues(m2, { low: 71, high: 74 });
    expect(remapScopeKey(viewed, [m1, m2, now], [m1, wider, now])).toBe(`g:${goalKey(wider)}`);
    const later = { ...m2, setOn: '2026-03-10' };
    expect(remapScopeKey(viewed, [m1, m2, now], [m1, later, now])).toBe(`g:${goalKey(later)}`);
  });

  it('goals a day apart read as joined', () => {
    const a = { ...makeGoal('gain', { target: 80 }, '2026-10-01'), endedOn: '2026-11-10' };
    const b = makeGoal('gain', { target: 82 }, '2026-11-11');
    expect(goalPhases([a, b])).toHaveLength(1);
    expect(spanDirection([a, b], '2026-11-10', '2026-11-11')).toBe('up');
    expect(spanDirection([a, b], '2026-11-09', '2026-11-11')).toBe('up');
    expect(spanDirection([a, b], '2026-11-09', '2026-11-12')).toBe('up');
    // A real gap still counts as time without a goal.
    const c = makeGoal('gain', { target: 82 }, '2026-11-14');
    expect(spanDirection([a, c], '2026-11-09', '2026-11-14')).toBeNull();
  });

  it('an earlier goal with no weigh-in inside it has an empty scope', () => {
    const g = { ...makeGoal('lose', { target: 80 }, '2026-11-03'), endedOn: '2026-11-08' };
    const es = [
      { date: '2026-11-01', weight: 85 },
      { date: '2026-11-10', weight: 84 },
    ];
    const sc = resolveScope(`g:${goalKey(g)}`, [g, makeGoal('gain', { target: 90 }, '2026-11-08')], es, '2026-11-12');
    expect(sc.entries).toEqual([]);
    expect(sc.baseline).toBeNull();
  });

  it('a pace from an older save or the cloud is kept only when it is sane', () => {
    const raw = (rate: unknown) => [{ ...cut, rate } as unknown as Goal];
    expect(migrateGoals(raw(0.5), null, entries)[0].rate).toBe(0.5);
    expect(migrateGoals(raw('0.5'), null, entries)[0]).not.toHaveProperty('rate');
    expect(migrateGoals(raw(20), null, entries)[0]).not.toHaveProperty('rate');
    expect(migrateGoals(raw(undefined), null, entries)[0]).not.toHaveProperty('rate');
    const m = { ...makeGoal('maintain', { low: 76, high: 78 }, '2026-11-07'), rate: 0.5 } as Goal;
    expect(migrateGoals([m], null, entries)[0]).not.toHaveProperty('rate');
  });

  it('compares goals by content', () => {
    expect(sameGoal(cut, { ...cut })).toBe(true);
    expect(sameGoal(bulk, { ...bulk, rate: 0.25 })).toBe(false);
    expect(sameGoal(cut, { ...cut, endedOn: '2026-11-08' })).toBe(false);
  });
});
