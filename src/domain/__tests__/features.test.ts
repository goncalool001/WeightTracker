import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  applyImport,
  buildImportPreview,
  buildInsights,
  buildStatus,
  categoryEffects,
  cleanTags,
  consecutiveDays,
  type CategoryId,
  makeGoal,
  normalizeEntries,
  periodSummary,
  previousBounds,
  upsertEntry,
  weekdayOffsets,
} from '@/domain';
import { SEED_ENTRIES, SEED_GOALS_LOSE, SEED_GOALS_MAINTAIN } from '@/data/seed';
import type { WeightEntry } from '@/types';

/** Daily weigh-ins from `start`, one per day, from a weight function. */
function daily(start: string, days: number, w: (i: number) => number): WeightEntry[] {
  return Array.from({ length: days }, (_, i) => ({
    date: addDaysISO(start, i),
    weight: Math.round(w(i) * 10) / 10,
  }));
}

describe('1 · early warning while maintaining', () => {
  it('stays quiet on your data (flat over the last two weeks, 0.7 kg from the floor)', () => {
    expect(buildStatus(SEED_ENTRIES, SEED_GOALS_MAINTAIN).drift).toBeNull();
  });

  it('warns with a date when the recent rate heads for an edge', () => {
    // Climbing about 0.5 kg/week, 7-day average around 77.3 inside 76–78.
    const entries = daily('2026-10-01', 25, (i) => 75.6 + i * 0.07);
    const goal = makeGoal('maintain', { low: 76, high: 78 }, '2026-10-01');
    const s = buildStatus(entries, [goal]);
    expect(s.drift).toMatchObject({ edge: 'high', limit: 78 });
    expect(s.drift!.date).not.toBeNull();
  });

  it('warns without a date when the average is merely close to an edge', () => {
    const entries = daily('2026-10-01', 25, (i) => 77.8 + (i % 2 ? 0.1 : -0.1));
    const goal = makeGoal('maintain', { low: 76, high: 78 }, '2026-10-01');
    expect(buildStatus(entries, [goal]).drift).toMatchObject({ edge: 'high', date: null });
  });
});

describe('2 · notes', () => {
  it('keeps, replaces and removes a note on upsert', () => {
    let { entries } = upsertEntry([], '2026-10-25', 76.5, { note: 'jantar fora' });
    expect(entries[0].note).toBe('jantar fora');
    ({ entries } = upsertEntry(entries, '2026-10-25', 76.4)); // undefined keeps it
    expect(entries[0]).toEqual({ date: '2026-10-25', weight: 76.4, note: 'jantar fora' });
    ({ entries } = upsertEntry(entries, '2026-10-25', 76.4, { note: null })); // null removes it
    expect(entries[0]).toEqual({ date: '2026-10-25', weight: 76.4 });
  });

  it('tidies notes and drops empty ones', () => {
    const e = normalizeEntries([
      { date: '2026-10-24', weight: 77.5, note: '  muito   sal ' },
      { date: '2026-10-25', weight: 76.5, note: '   ' },
    ]);
    expect(e).toEqual([
      { date: '2026-10-24', weight: 77.5, note: 'muito sal' },
      { date: '2026-10-25', weight: 76.5 },
    ]);
  });

  it('an import without notes keeps the notes already saved', () => {
    const existing = [{ date: '2026-10-25', weight: 76.5, note: 'viagem' }];
    const p = buildImportPreview([{ row: 2, date: '2026-10-25', weight: 76.4 }], existing, '2026-10-25');
    expect(applyImport(existing, p.valid, 'merge')[0]).toEqual({
      date: '2026-10-25',
      weight: 76.4,
      note: 'viagem',
    });
  });
});

describe('3 · days in a row', () => {
  it('counts back from today, or from yesterday before today is logged', () => {
    expect(consecutiveDays(SEED_ENTRIES, '2026-10-25')).toBe(3); // 23, 24, 25 Oct
    expect(consecutiveDays(SEED_ENTRIES, '2026-10-26')).toBe(3); // today not logged yet
    expect(consecutiveDays(SEED_ENTRIES, '2026-10-28')).toBe(0);
  });
});

describe('4 · weekday pattern', () => {
  it('reports a weekday that sits clearly above its week', () => {
    // Flat 80 kg, but every Monday 0.8 kg heavier, for 10 weeks.
    const entries = daily('2026-06-01', 70, (i) => {
      const wd = new Date(Date.UTC(2026, 5, 1 + i)).getUTCDay();
      return wd === 1 ? 80.8 : 80;
    });
    expect(weekdayOffsets(entries)[1].offset).toBeGreaterThan(0.5);
    const weekday = buildInsights({ entries, goals: [] }).find((i) => i.id === 'weekday');
    expect(weekday?.text).toMatch(/Mondays/);
    expect(weekday?.text).toMatch(/more/);
  });

  it('says nothing when the offsets are within normal noise', () => {
    const entries = daily('2026-06-01', 70, (i) => 80 + (i % 3) * 0.1);
    expect(buildInsights({ entries, goals: [] }).some((i) => i.id === 'weekday')).toBe(false);
  });
});

describe('5 · forecast as a range', () => {
  it('gives an early and a late date around the 28-day rate', () => {
    const s = buildStatus(SEED_ENTRIES, SEED_GOALS_LOSE);
    expect(s.projection).not.toBeNull();
    const { early, late } = s.projection!;
    expect(early > '2026-10-25').toBe(true);
    if (late) expect(late >= early).toBe(true);
  });
});

describe('7 · compare with the period before', () => {
  it('takes the same number of days just before', () => {
    expect(previousBounds({ from: '2026-09-26', to: '2026-10-25' })).toEqual({
      from: '2026-08-27',
      to: '2026-09-25',
    });
  });

  it('summarises a period', () => {
    const s = periodSummary(SEED_ENTRIES, { from: '2026-10-19', to: '2026-10-25' });
    expect(s).toMatchObject({ count: 6, low: 76.2, high: 77.5 });
    expect(s!.average).toBeCloseTo(76.73, 2);
    expect(periodSummary(SEED_ENTRIES, { from: '2025-01-01', to: '2025-01-31' })).toBeNull();
  });
});

describe('categories and their effect', () => {
  // 60 days around 80 kg with small noise; "salty" on 12 days, each +0.8 kg.
  const base = daily('2026-06-01', 60, (i) => 80 + ((i * 7) % 5) * 0.05);
  const salty = new Set([10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54]);
  const entries: WeightEntry[] = base.map((e, i) =>
    salty.has(i)
      ? { ...e, weight: Math.round((e.weight + 0.8) * 10) / 10, tags: ['salty'] }
      : i === 20 || i === 40
        ? { ...e, tags: ['stress'] }
        : e,
  );

  it('keeps only known category ids, in order, without repeats', () => {
    expect(cleanTags(['stress', 'salty', 'nope', 'salty'])).toEqual(['salty', 'stress']);
    expect(cleanTags([])).toBeUndefined();
  });

  it('measures the effect on the weigh-in that carries the category', () => {
    const r = categoryEffects(entries);
    const s = r.rows.find((x) => x.id === 'salty')!;
    expect(s.tier).toBe('reliable');
    expect(s.effect!).toBeGreaterThan(0.6);
    expect(s.unclear).toBe(false);
    expect(r.finding?.id).toBe('salty');
    // The day after is back near the reference.
    expect(Math.abs(s.next1!.effect)).toBeLessThan(0.3);
  });

  it('does not show an effect for categories with fewer than 5 weigh-ins', () => {
    const st = categoryEffects(entries).rows.find((x) => x.id === 'stress')!;
    expect(st).toMatchObject({ n: 2, tier: 'few', effect: null });
  });

  it('counts how many rises above 0.5 kg carry a category', () => {
    const r = categoryEffects(entries);
    expect(r.swings.tagged).toBe(r.swings.total);
    expect(r.swings.total).toBeGreaterThan(0);
  });

  it('feeds the Today analysis only with a label resolver', () => {
    const ids = (catLabel?: (id: CategoryId) => string) =>
      buildInsights({ entries, goals: [], catLabel }).map((i) => i.id);
    expect(ids((id) => id)).toContain('category');
    expect(ids()).not.toContain('category');
  });
});
