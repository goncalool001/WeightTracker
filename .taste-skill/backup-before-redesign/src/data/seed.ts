import type { WeightEntry } from '@/types';

/**
 * Initial dataset, exported once from the user's `weight_data.xlsx`.
 *
 * Loaded automatically on first launch (when local storage is empty) so the
 * app opens showing the existing history, exactly as the desktop app did.
 * After the first run, IndexedDB is the source of truth and this is ignored.
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
];
