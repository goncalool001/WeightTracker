import { describe, expect, it } from 'vitest';
import {
  applyImport,
  averageGaps,
  belowSince,
  buildImportPreview,
  buildInsights,
  buildStatus,
  currentGoal,
  goalReachedOn,
  makeGoal,
  migrateGoals,
  parseDateCell,
  parseWeightCell,
  replaceGoal,
  rollingCalendarAverage,
  windowAverage,
} from '@/domain';
import {
  SEED_ENTRIES,
  SEED_GOALS_GAIN,
  SEED_GOALS_LOSE,
  SEED_GOALS_MAINTAIN,
} from '@/data/seed';

/**
 * Figures checked against weight_data_25-Oct-2026.xlsx (133 weigh-ins,
 * 18 Apr – 25 Oct 2026). These are the numbers the Today screen shows.
 */

describe('calendar 7-day average', () => {
  it('averages the weigh-ins dated in the last 7 calendar days', () => {
    const w = windowAverage(SEED_ENTRIES, '2026-10-25');
    expect(w.count).toBe(6); // 22 Oct has no weigh-in
    expect(w.average).toBeCloseTo(76.733, 2);
  });

  it('leaves no average where a window has fewer than 2 weigh-ins', () => {
    const series = rollingCalendarAverage(SEED_ENTRIES);
    expect(series[0]).toEqual({ date: '2026-04-18', average: null, count: 1 });
    expect(series).toHaveLength(191); // every calendar day, 18 Apr to 25 Oct
    expect(series.filter((p) => p.average == null).length).toBeGreaterThan(0);
    // No value is ever produced for a window with fewer than 2 weigh-ins.
    expect(series.every((p) => p.average == null || p.count >= 2)).toBe(true);
    // With your data every window after the first days has at least 2.
    expect(averageGaps(series)).toEqual([]);
  });

  it('bridges interior gaps, not the edges', () => {
    const pts = [
      { date: '2026-01-01', average: null, count: 1 },
      { date: '2026-01-02', average: 80, count: 2 },
      { date: '2026-01-03', average: null, count: 1 },
      { date: '2026-01-04', average: null, count: 1 },
      { date: '2026-01-05', average: 79, count: 2 },
      { date: '2026-01-06', average: null, count: 1 },
    ];
    expect(averageGaps(pts)).toEqual([
      { from: { date: '2026-01-02', average: 80 }, to: { date: '2026-01-05', average: 79 } },
    ]);
  });
});

describe('belowSince', () => {
  it('counts from the first weigh-in after the last one at or above the threshold', () => {
    // Back at 80.6 kg on 1 Sep, so the streak starts on 2 Sep.
    expect(belowSince(SEED_ENTRIES, 80)).toEqual({ since: '2026-09-02', days: 53 });
  });
});

describe('goals', () => {
  it('records when the 80 kg goal was passed (strictly below)', () => {
    const g = SEED_GOALS_MAINTAIN[0];
    expect(goalReachedOn(g, SEED_ENTRIES)).toEqual({ date: '2026-07-12', weight: 79.9 });
  });

  it('migrates a legacy goalWeight into a lose goal', () => {
    const goals = migrateGoals(undefined, 80, SEED_ENTRIES);
    expect(goals).toHaveLength(1);
    expect(currentGoal(goals)).toMatchObject({ mode: 'lose', target: 80, setOn: '2026-04-18' });
  });

  it('converts old reach goals by the weight on the day they were set', () => {
    const goals = migrateGoals(
      [
        { mode: 'reach', target: 80, low: 80, high: 80, setOn: '2026-04-18', endedOn: '2026-10-25' },
        { mode: 'reach', target: 78, low: 78, high: 78, setOn: '2026-10-25', endedOn: null },
      ],
      null,
      SEED_ENTRIES,
    );
    expect(goals.map((g) => g.mode)).toEqual(['lose', 'gain']);
  });

  it('ends the current goal on change but overwrites one set the same day', () => {
    const first = makeGoal('lose', { target: 80 }, '2026-04-18');
    let goals = replaceGoal([], first, '2026-04-18');
    goals = replaceGoal(goals, makeGoal('maintain', { low: 78, high: 76 }, ''), '2026-10-25');
    expect(goals).toHaveLength(2);
    expect(goals[0].endedOn).toBe('2026-10-25');
    expect(goals[1]).toMatchObject({ low: 76, high: 78, target: 77, endedOn: null });
    goals = replaceGoal(goals, makeGoal('maintain', { low: 75.5, high: 77.5 }, ''), '2026-10-25');
    expect(goals).toHaveLength(2);
    expect(currentGoal(goals)).toMatchObject({ low: 75.5, high: 77.5 });
  });
});

describe('buildStatus', () => {
  it('maintaining 76–78 kg', () => {
    const s = buildStatus(SEED_ENTRIES, SEED_GOALS_MAINTAIN);
    expect(s.phase).toBe('maintain');
    expect(s.latest).toEqual({ date: '2026-10-25', weight: 76.5 });
    expect(s.avg7).toBe(76.7);
    expect(s.avg7Prev).toBe(76.8);
    expect(s.avg7Delta).toBe(-0.1);
    expect(s.trend).toBe('flat');
    expect(s.bandPosition).toBe('inside');
    expect(s.stay).toEqual({ threshold: 80, side: 'below', since: '2026-09-02', days: 53 });
    expect(s.reached).toEqual({ date: '2026-07-12', weight: 79.9 });
    expect(s.sinceStart).toBe(-9.6);
    expect(s.rate).toBeCloseTo(-0.436, 2);
  });

  it('on the way down to 75 kg', () => {
    const s = buildStatus(SEED_ENTRIES, SEED_GOALS_LOSE);
    expect(s.phase).toBe('reach');
    expect(s.toGo).toBe(1.5);
    expect(s.projection).not.toBeNull();
    expect(s.progress).toBeGreaterThan(0);
  });

  it('on the way up to 78 kg', () => {
    const s = buildStatus(SEED_ENTRIES, SEED_GOALS_GAIN);
    expect(s.phase).toBe('reach');
    expect(s.toGo).toBe(1.5);
    // The first weigh-in (86.1) lies past 78, so progress starts from the day the goal was set.
    expect(s.journeyStart).toEqual({ date: '2026-10-25', weight: 76.5 });
    expect(s.progress).toBe(0);
    // Losing at −0.44 kg/wk is the wrong way for a gain goal: no projection.
    expect(s.projection).toBeNull();
  });

  it('counts days above a passed gain target', () => {
    const entries = [
      { date: '2026-01-01', weight: 60 },
      { date: '2026-01-10', weight: 62.5 },
      { date: '2026-01-12', weight: 63 },
    ];
    const s = buildStatus(entries, [makeGoal('gain', { target: 62 }, '2026-01-01')]);
    expect(s.phase).toBe('reached');
    expect(s.stay).toEqual({ threshold: 62, side: 'above', since: '2026-01-10', days: 2 });
  });

  it('empty', () => {
    expect(buildStatus([], []).phase).toBe('empty');
  });

  it('feeds maintenance insights', () => {
    const ids = buildInsights({ entries: SEED_ENTRIES, goals: SEED_GOALS_MAINTAIN }).map(
      (i) => i.id,
    );
    expect(ids).toContain('spread');
  });
});

describe('import validation', () => {
  it('parses the date and weight formats people actually have', () => {
    expect(parseDateCell('2026-10-25')).toBe('2026-10-25');
    expect(parseDateCell('25/10/2026')).toBe('2026-10-25');
    expect(parseDateCell('25 out 2026')).toBe('2026-10-25');
    expect(parseDateCell('25 Oct 2026')).toBe('2026-10-25');
    expect(parseDateCell(46320)).toBe('2026-10-25'); // Excel serial
    expect(parseDateCell('2026-02-30')).toBeNull();
    expect(parseDateCell('ontem')).toBeNull();
    expect(parseWeightCell('76,5')).toBe(76.5);
    expect(parseWeightCell('76.5 kg')).toBe(76.5);
    expect(parseWeightCell('abc')).toBeNull();
  });

  it('flags bad dates, duplicates, out-of-range and future rows', () => {
    const p = buildImportPreview(
      [
        { row: 2, date: '2026-10-24', weight: 77.5 }, // same as saved
        { row: 3, date: '2026-10-25', weight: '76,9' }, // changed
        { row: 4, date: '2026-10-26', weight: 76 }, // future
        { row: 5, date: '2026-10-20', weight: 260 }, // out of range
        { row: 6, date: '31/02/2026', weight: 70 }, // bad date
        { row: 7, date: '2026-10-24', weight: 77 }, // duplicate in file
        { row: 8, date: '2026-10-22', weight: 76.6 }, // new (no weigh-in that day)
      ],
      SEED_ENTRIES,
      '2026-10-25',
    );
    expect(p.counts).toMatchObject({
      total: 7, rejected: 4, same: 1, changed: 1, new: 1,
      future: 1, outOfRange: 1, badDate: 1, duplicate: 1,
    });
    expect(p.valid).toHaveLength(3);
    const merged = applyImport(SEED_ENTRIES, p.valid, 'merge');
    expect(merged).toHaveLength(134);
    expect(merged.find((e) => e.date === '2026-10-25')?.weight).toBe(76.9);
    expect(applyImport(SEED_ENTRIES, p.valid, 'replace')).toHaveLength(3);
  });
});
