import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goalKey, makeGoal } from '@/domain';
import type { Goal, PersistedState, ScopeKey, WeightEntry } from '@/types';

// The store persists to IndexedDB and syncs to Firestore; neither exists here.
const saved: PersistedState[] = [];
vi.mock('@/data/storage', () => ({
  loadState: vi.fn(async () => null),
  saveState: vi.fn(async (s: PersistedState) => {
    saved.push(s);
  }),
}));
vi.mock('@/data/sync', () => ({
  pushEntry: vi.fn(),
  pushDeleteEntry: vi.fn(),
  pushGoals: vi.fn(),
  pushReplace: vi.fn(),
}));

import { useStore } from '../useStore';

const cut: Goal = { ...makeGoal('lose', { target: 75 }, '2026-04-18'), endedOn: '2026-11-07' };
const bulk: Goal = makeGoal('gain', { target: 78 }, '2026-11-07');
const PAST: ScopeKey = `g:${goalKey(cut)}`;
const entries: WeightEntry[] = [
  { date: '2026-04-18', weight: 86.1 },
  { date: '2026-11-06', weight: 75.9 },
  { date: '2026-11-07', weight: 74.6 },
  { date: '2026-11-08', weight: 75.7 },
];
const lastSaved = () => saved[saved.length - 1];

beforeEach(() => {
  saved.length = 0;
  useStore.setState({
    entries,
    goals: [cut, bulk],
    scope: 'current',
    range: '90d',
    customRange: null,
    ephemeral: false,
    user: null,
  });
});

describe('what Today covers (scope) in the store', () => {
  it('keeps "everything" across reloads but never an earlier goal', () => {
    useStore.getState().setScope('all');
    expect(lastSaved().scope).toBe('all');
    useStore.getState().setScope(PAST);
    expect(useStore.getState().scope).toBe(PAST);
    expect(lastSaved().scope).toBe('current');
  });

  it('dates picked inside an earlier goal are not kept either', () => {
    useStore.getState().setScope(PAST);
    useStore.getState().setCustomRange({ from: '2026-10-01', to: '2026-11-07' });
    expect(lastSaved()).toMatchObject({ scope: 'current', range: 'all', customRange: null });
  });

  it('choosing a scope starts the date range afresh, presets stay', () => {
    useStore.getState().setCustomRange({ from: '2026-11-07', to: '2026-11-08' });
    useStore.getState().setScope('all');
    expect(useStore.getState()).toMatchObject({ range: 'all', customRange: null });
    useStore.getState().setRange('30d');
    useStore.getState().setScope('current');
    expect(useStore.getState().range).toBe('30d');
  });

  it('a new goal brings Today back to the goal in force', () => {
    useStore.getState().setScope('all');
    useStore.getState().setGoal(makeGoal('lose', { target: 74 }, '2026-11-13'));
    expect(useStore.getState().scope).toBe('current');
  });

  it('a new weigh-in after the earlier goal being viewed returns to the goal in force', () => {
    useStore.getState().setScope(PAST);
    // The day the two goals meet belongs to both: editing it changes nothing.
    useStore.getState().addOrUpdate('2026-11-07', 74.7);
    expect(useStore.getState().scope).toBe(PAST);
    // Editing a later day that already exists does not move the view.
    useStore.getState().addOrUpdate('2026-11-08', 75.8);
    expect(useStore.getState().scope).toBe(PAST);
    // A new day after the goal ended does.
    useStore.getState().addOrUpdate('2026-11-09', 74.9);
    expect(useStore.getState().scope).toBe('current');
  });

  it('follows an earlier goal whose dates are edited, and lets go of a deleted one', () => {
    useStore.getState().setScope(PAST);
    const moved = { ...cut, setOn: '2026-04-20' };
    useStore.getState().restoreGoals([moved, bulk]);
    expect(useStore.getState().scope).toBe(`g:${goalKey(moved)}`);
    useStore.getState().restoreGoals([bulk]);
    expect(useStore.getState().scope).toBe('current');
  });

  it('a cloud echo of the same goals changes nothing; a real change is applied', () => {
    const before = useStore.getState().goals;
    useStore.getState().applyRemoteSettings({ goals: [{ ...cut }, { ...bulk }], goalWeight: 78 });
    expect(useStore.getState().goals).toBe(before);
    useStore.getState().applyRemoteSettings({ goals: [{ ...cut }, { ...bulk, rate: 0.25 }], goalWeight: 78 });
    expect(useStore.getState().goals[1].rate).toBe(0.25);
  });

  it('undoing a goal change puts the view back', () => {
    useStore.getState().setScope('all');
    const before = useStore.getState().setGoal(makeGoal('lose', { target: 74 }, '2026-11-13'));
    useStore.getState().restoreGoals(before, 'all');
    expect(useStore.getState()).toMatchObject({ scope: 'all', goals: [cut, bulk] });
  });
});
