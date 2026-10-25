import { describe, expect, it } from 'vitest';
import {
  buildInsights,
  buildMetrics,
  classifyDelta,
  filterByRange,
  filterPeriodsByRange,
  goalProjection,
  linearFit,
  monthlyPeriods,
  movingAverage,
  normalizeEntries,
  upsertEntry,
  weeklyAverages,
  weeklyPeriods,
} from '@/domain';
import type { WeightEntry } from '@/types';

/**
 * The fixture is the first portion of the user's real dataset. Expected weekly
 * outputs are taken directly from the original desktop app's "Weekly Averages"
 * sheet, so these tests assert byte-for-byte parity with the Python logic.
 */
const sample: WeightEntry[] = [
  { date: '2026-04-18', weight: 86.1 },
  { date: '2026-04-23', weight: 85.5 },
  { date: '2026-04-24', weight: 85.2 },
  { date: '2026-04-25', weight: 85.3 },
  { date: '2026-04-26', weight: 85.2 },
  { date: '2026-04-28', weight: 85.2 },
  { date: '2026-04-29', weight: 85.5 },
  { date: '2026-04-30', weight: 85.1 },
];

describe('weeklyAverages', () => {
  it('groups Monday–Sunday and matches the desktop app output', () => {
    const weekly = weeklyAverages(sample);
    expect(weekly).toHaveLength(3);

    // Week 1: only 18 Apr → 86.1
    expect(weekly[0]).toEqual({
      weekStart: '2026-04-13',
      weekEnd: '2026-04-19',
      averageWeight: 86.1,
      measurements: 1,
    });

    // Week 2: 23–26 Apr → mean(85.5, 85.2, 85.3, 85.2) = 85.3
    expect(weekly[1]).toEqual({
      weekStart: '2026-04-20',
      weekEnd: '2026-04-26',
      averageWeight: 85.3,
      measurements: 4,
    });

    // Week 3: 28–30 Apr → mean(85.2, 85.5, 85.1) = 85.27 (2dp)
    expect(weekly[2]).toMatchObject({
      weekStart: '2026-04-27',
      weekEnd: '2026-05-03',
      averageWeight: 85.27,
      measurements: 3,
    });
  });

  it('returns an empty array for no entries', () => {
    expect(weeklyAverages([])).toEqual([]);
  });
});

describe('linearFit', () => {
  it('recovers a known line exactly', () => {
    const fit = linearFit([0, 1, 2, 3], [1, 3, 5, 7]); // y = 2x + 1
    expect(fit.slope).toBeCloseTo(2, 10);
    expect(fit.intercept).toBeCloseTo(1, 10);
  });

  it('throws with fewer than two points', () => {
    expect(() => linearFit([0], [1])).toThrow();
  });
});

describe('movingAverage', () => {
  it('uses partial windows at the start (min_periods=1)', () => {
    expect(movingAverage([2, 4, 6], 7)).toEqual([2, 3, 4]);
  });
});

describe('classifyDelta', () => {
  it('honours the ±0.05 dead-band', () => {
    expect(classifyDelta(null)).toBe('flat');
    expect(classifyDelta(-0.2)).toBe('down');
    expect(classifyDelta(0.2)).toBe('up');
    expect(classifyDelta(0.04)).toBe('flat');
  });
});

describe('upsertEntry', () => {
  it('adds a new date', () => {
    const r = upsertEntry(sample, '2026-05-01', 84.9);
    expect(r.action).toBe('added');
    expect(r.entries).toHaveLength(sample.length + 1);
  });

  it('updates an existing date in place', () => {
    const r = upsertEntry(sample, '2026-04-18', 90);
    expect(r.action).toBe('updated');
    expect(r.entries).toHaveLength(sample.length);
    expect(r.entries.find((e) => e.date === '2026-04-18')?.weight).toBe(90);
  });
});

describe('normalizeEntries', () => {
  it('dedupes by date (last wins) and sorts ascending', () => {
    const out = normalizeEntries([
      { date: '2026-01-02', weight: 80 },
      { date: '2026-01-01', weight: 81 },
      { date: '2026-01-02', weight: 79 },
    ]);
    expect(out).toEqual([
      { date: '2026-01-01', weight: 81 },
      { date: '2026-01-02', weight: 79 },
    ]);
  });
});

describe('filterByRange', () => {
  it('keeps entries within 30 days of the latest entry', () => {
    const out = filterByRange(sample, '30d');
    // latest is 30 Apr; 18 Apr is 12 days earlier → still included
    expect(out).toHaveLength(sample.length);
  });

  it('keeps only the last 7 days (inclusive of the latest entry)', () => {
    // latest is 30 Apr; cutoff = 24 Apr → entries 24–30 Apr
    const out = filterByRange(sample, '7d');
    expect(out.map((e) => e.date)).toEqual([
      '2026-04-24',
      '2026-04-25',
      '2026-04-26',
      '2026-04-28',
      '2026-04-29',
      '2026-04-30',
    ]);
  });

  it('returns everything for "all"', () => {
    expect(filterByRange(sample, 'all')).toBe(sample);
  });
});

describe('periods', () => {
  it('numbers weekly periods from the start of the dataset', () => {
    const wp = weeklyPeriods(sample);
    expect(wp).toHaveLength(3);
    expect(wp.map((p) => p.number)).toEqual([1, 2, 3]);
    expect(wp[1]).toMatchObject({
      number: 2,
      start: '2026-04-20',
      end: '2026-04-26',
      average: 85.3,
      measurements: 4,
    });
  });

  it('aggregates monthly with measurement counts', () => {
    const mp = monthlyPeriods(sample);
    expect(mp).toHaveLength(1);
    expect(mp[0]).toMatchObject({ number: 1, measurements: 8 });
    expect(mp[0].label).toBe('Apr 2026');
  });

  it('preserves dataset numbering when filtering by range', () => {
    const filtered = filterPeriodsByRange(weeklyPeriods(sample), '7d', sample);
    // latest 30 Apr; cutoff 24 Apr → weeks #2 and #3 overlap, #1 drops
    expect(filtered.map((p) => p.number)).toEqual([2, 3]);
  });
});

describe('buildInsights', () => {
  it('returns an empty list with too little data', () => {
    expect(buildInsights({ entries: [], goal: null })).toEqual([]);
    expect(
      buildInsights({ entries: [{ date: '2026-01-01', weight: 80 }], goal: null }),
    ).toEqual([]);
  });

  it('surfaces the fastest-loss week and avoids restating KPIs', () => {
    const insights = buildInsights({ entries: sample, goal: null });
    const ids = insights.map((i) => i.id);
    expect(ids).toContain('best');
    // Should not re-emit KPI-style cards by their old ids.
    expect(ids).not.toContain('trend');
    expect(ids).not.toContain('start');
  });

  it('emits goal pace + clamped progress when a goal is set', () => {
    const insights = buildInsights({ entries: sample, goal: 80 });
    const ids = insights.map((i) => i.id);
    expect(ids).toContain('goal-pace');

    const progress = insights.find((i) => i.id === 'progress');
    expect(progress).toBeDefined();
    expect(progress!.progress).toBeGreaterThanOrEqual(0);
    expect(progress!.progress).toBeLessThanOrEqual(100);
  });
});

describe('buildMetrics', () => {
  it('computes latest, weekly and rate', () => {
    const m = buildMetrics(sample, weeklyAverages(sample));
    expect(m.totalEntries).toBe(8);
    expect(m.latest).toEqual({ weight: 85.1, date: '2026-04-30' });
    expect(m.ratePerWeek).not.toBeNull();
    expect(m.vsLastWeek).not.toBeNull();
  });
});

describe('goalProjection', () => {
  it('projects a date when trending toward a reachable goal', () => {
    const declining: WeightEntry[] = Array.from({ length: 21 }, (_, i) => ({
      date: `2026-0${1 + Math.floor(i / 7)}-${String((i % 7) * 4 + 1).padStart(2, '0')}`,
      weight: 90 - i * 0.3,
    }));
    const weekly = weeklyAverages(declining);
    const proj = goalProjection(weekly, 80);
    expect(proj).not.toBeNull();
    expect(proj!.weeksRemaining).toBeGreaterThan(0);
  });

  it('returns null without a goal', () => {
    expect(goalProjection(weeklyAverages(sample), null)).toBeNull();
  });
});
