import type { Goal, WeightEntry } from '@/types';

/**
 * Development seed, converted from `weight_data_25-Oct-2026.xlsx` (sheet
 * "Daily Data"): 133 entries from 18 Apr to 25 Oct 2026.
 *
 * Loaded only by the dev server with `?seed` in the URL (see devSeed.ts); it
 * is never bundled into the production build.
 */
export const SEED_ENTRIES: WeightEntry[] = [
  { date: '2026-04-18', weight: 86.1 },
  { date: '2026-04-23', weight: 85.5 },
  { date: '2026-04-24', weight: 85.2 },
  { date: '2026-04-25', weight: 85.3 },
  { date: '2026-04-26', weight: 85.2 },
  { date: '2026-04-28', weight: 85.2 },
  { date: '2026-04-29', weight: 85.5 },
  { date: '2026-04-30', weight: 85.1 },
  { date: '2026-05-03', weight: 86.5 },
  { date: '2026-05-04', weight: 85.7 },
  { date: '2026-05-06', weight: 84.3 },
  { date: '2026-05-08', weight: 85.3 },
  { date: '2026-05-09', weight: 84.7 },
  { date: '2026-05-10', weight: 84.1 },
  { date: '2026-05-11', weight: 84.3 },
  { date: '2026-05-12', weight: 84.4 },
  { date: '2026-05-13', weight: 85.1 },
  { date: '2026-05-14', weight: 84.0 },
  { date: '2026-05-16', weight: 84.9 },
  { date: '2026-05-17', weight: 84.4 },
  { date: '2026-05-19', weight: 85.0 },
  { date: '2026-05-20', weight: 83.6 },
  { date: '2026-05-21', weight: 83.2 },
  { date: '2026-05-23', weight: 84.0 },
  { date: '2026-05-25', weight: 84.0 },
  { date: '2026-05-26', weight: 84.4 },
  { date: '2026-05-27', weight: 83.9 },
  { date: '2026-05-29', weight: 84.2 },
  { date: '2026-05-30', weight: 83.2 },
  { date: '2026-05-31', weight: 83.0 },
  { date: '2026-06-01', weight: 83.5 },
  { date: '2026-06-02', weight: 83.1 },
  { date: '2026-06-03', weight: 82.8 },
  { date: '2026-06-04', weight: 82.9 },
  { date: '2026-06-05', weight: 82.7 },
  { date: '2026-06-09', weight: 83.1 },
  { date: '2026-06-10', weight: 81.8 },
  { date: '2026-06-11', weight: 81.6 },
  { date: '2026-06-12', weight: 81.6 },
  { date: '2026-06-14', weight: 81.6 },
  { date: '2026-06-15', weight: 81.3 },
  { date: '2026-06-16', weight: 81.6 },
  { date: '2026-06-17', weight: 81.5 },
  { date: '2026-06-18', weight: 82.0 },
  { date: '2026-06-20', weight: 81.6 },
  { date: '2026-06-21', weight: 81.2 },
  { date: '2026-06-22', weight: 81.2 },
  { date: '2026-06-23', weight: 81.3 },
  { date: '2026-06-27', weight: 81.0 },
  { date: '2026-06-28', weight: 80.0 },
  { date: '2026-06-29', weight: 80.9 },
  { date: '2026-06-30', weight: 80.9 },
  { date: '2026-07-01', weight: 80.7 },
  { date: '2026-07-02', weight: 80.8 },
  { date: '2026-07-06', weight: 81.1 },
  { date: '2026-07-07', weight: 80.6 },
  { date: '2026-07-08', weight: 80.7 },
  { date: '2026-07-09', weight: 80.1 },
  { date: '2026-07-11', weight: 80.3 },
  { date: '2026-07-12', weight: 79.9 },
  { date: '2026-07-13', weight: 80.3 },
  { date: '2026-07-14', weight: 80.3 },
  { date: '2026-07-15', weight: 79.8 },
  { date: '2026-07-16', weight: 79.7 },
  { date: '2026-07-17', weight: 80.1 },
  { date: '2026-07-21', weight: 79.8 },
  { date: '2026-07-22', weight: 79.6 },
  { date: '2026-07-23', weight: 79.2 },
  { date: '2026-07-25', weight: 80.0 },
  { date: '2026-07-27', weight: 80.5 },
  { date: '2026-07-28', weight: 79.8 },
  { date: '2026-07-29', weight: 79.1 },
  { date: '2026-07-30', weight: 79.2 },
  { date: '2026-08-01', weight: 79.6 },
  { date: '2026-08-03', weight: 80.3 },
  { date: '2026-08-04', weight: 80.1 },
  { date: '2026-08-05', weight: 79.4 },
  { date: '2026-08-06', weight: 79.2 },
  { date: '2026-08-08', weight: 78.6 },
  { date: '2026-08-09', weight: 79.0 },
  { date: '2026-08-10', weight: 79.6 },
  { date: '2026-08-11', weight: 79.5 },
  { date: '2026-08-12', weight: 79.3 },
  { date: '2026-08-15', weight: 79.2 },
  { date: '2026-08-19', weight: 79.1 },
  { date: '2026-08-20', weight: 78.9 },
  { date: '2026-08-21', weight: 79.2 },
  { date: '2026-08-24', weight: 79.3 },
  { date: '2026-08-25', weight: 79.0 },
  { date: '2026-08-26', weight: 78.8 },
  { date: '2026-08-28', weight: 79.2 },
  { date: '2026-09-01', weight: 80.6 },
  { date: '2026-09-02', weight: 78.9 },
  { date: '2026-09-04', weight: 78.4 },
  { date: '2026-09-05', weight: 78.4 },
  { date: '2026-09-07', weight: 79.4 },
  { date: '2026-09-08', weight: 78.7 },
  { date: '2026-09-09', weight: 78.8 },
  { date: '2026-09-10', weight: 78.4 },
  { date: '2026-09-12', weight: 78.3 },
  { date: '2026-09-13', weight: 78.5 },
  { date: '2026-09-14', weight: 78.5 },
  { date: '2026-09-15', weight: 77.8 },
  { date: '2026-09-16', weight: 77.6 },
  { date: '2026-09-17', weight: 77.9 },
  { date: '2026-09-18', weight: 78.6 },
  { date: '2026-09-24', weight: 79.1 },
  { date: '2026-09-25', weight: 77.7 },
  { date: '2026-09-26', weight: 77.3 },
  { date: '2026-09-27', weight: 77.7 },
  { date: '2026-09-28', weight: 78.3 },
  { date: '2026-09-29', weight: 78.2 },
  { date: '2026-09-30', weight: 78.1 },
  { date: '2026-10-01', weight: 78.1 },
  { date: '2026-10-02', weight: 78.1 },
  { date: '2026-10-04', weight: 77.8 },
  { date: '2026-10-07', weight: 77.8 },
  { date: '2026-10-08', weight: 76.9 },
  { date: '2026-10-09', weight: 76.8 },
  { date: '2026-10-10', weight: 76.4 },
  { date: '2026-10-11', weight: 77.2 },
  { date: '2026-10-12', weight: 77.0 },
  { date: '2026-10-13', weight: 77.1 },
  { date: '2026-10-14', weight: 77.0 },
  { date: '2026-10-16', weight: 76.8 },
  { date: '2026-10-17', weight: 76.6 },
  { date: '2026-10-18', weight: 76.4 },
  { date: '2026-10-19', weight: 76.2 },
  { date: '2026-10-20', weight: 76.5 },
  { date: '2026-10-21', weight: 76.9 },
  { date: '2026-10-23', weight: 76.8 },
  { date: '2026-10-24', weight: 77.5 },
  { date: '2026-10-25', weight: 76.5 },
];

/** Goal history for the "maintaining" state (`?seed` or `?seed=maintain`). */
export const SEED_GOALS_MAINTAIN: Goal[] = [
  { mode: 'lose', target: 80, low: 80, high: 80, setOn: '2026-04-18', endedOn: '2026-10-25' },
  { mode: 'maintain', target: 77, low: 76, high: 78, setOn: '2026-10-25', endedOn: null },
];

/** Goal history for "on the way down" (`?seed=lose`): 75 kg still ahead. */
export const SEED_GOALS_LOSE: Goal[] = [
  { mode: 'lose', target: 80, low: 80, high: 80, setOn: '2026-04-18', endedOn: '2026-10-25' },
  { mode: 'lose', target: 75, low: 75, high: 75, setOn: '2026-10-25', endedOn: null },
];

/** Goal history for "on the way up" (`?seed=gain`): back up to 78 kg. */
export const SEED_GOALS_GAIN: Goal[] = [
  { mode: 'lose', target: 80, low: 80, high: 80, setOn: '2026-04-18', endedOn: '2026-10-25' },
  { mode: 'gain', target: 78, low: 78, high: 78, setOn: '2026-10-25', endedOn: null },
];

/**
 * Illustrative categories for the dev seed only (`?seed&tags`), so the
 * category analysis can be seen with data. Invented, not the user's: a rise
 * of more than 0.4 kg gets a food or social reason, a drop of more than 0.4 kg
 * a workout, and every 11th weigh-in "slept badly".
 */
export function withDemoTags(entries: WeightEntry[]): WeightEntry[] {
  const rises = [['salty'], ['alcohol', 'social'], ['big_meal'], ['late_meal']];
  let r = 0;
  return entries.map((e, i) => {
    if (i === 0) return e;
    const d = e.weight - entries[i - 1].weight;
    if (d > 0.4) return { ...e, tags: rises[r++ % rises.length] };
    if (d < -0.4) return { ...e, tags: ['hard_workout'] };
    if (i % 11 === 0) return { ...e, tags: ['poor_sleep'] };
    return e;
  });
}
