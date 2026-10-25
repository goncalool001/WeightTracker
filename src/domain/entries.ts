import { cleanTags, type CategoryId } from './categories';
import type { WeightEntry } from '@/types';

/** Longest note kept on a weigh-in. */
export const NOTE_MAX = 80;

/** Round a weight to 1 decimal place (the app's storage precision). */
export function roundWeight(weight: number): number {
  return Math.round((weight + Number.EPSILON) * 10) / 10;
}

/** A tidy note, or undefined when there is nothing worth keeping. */
export function cleanNote(note: unknown): string | undefined {
  if (typeof note !== 'string') return undefined;
  const s = note.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX);
  return s === '' ? undefined : s;
}

/** An entry with only the fields the app stores (no empty note or tags keys). */
function entryOf(date: string, weight: number, note?: string, tags?: CategoryId[]): WeightEntry {
  const e: WeightEntry = { date, weight };
  if (note) e.note = note;
  if (tags && tags.length) e.tags = tags;
  return e;
}

/** Normalise a list of entries: coerce, drop invalid, dedupe by date (last
 *  wins), and sort ascending. Mirrors the desktop loader's data hygiene. */
export function normalizeEntries(raw: WeightEntry[]): WeightEntry[] {
  const byDate = new Map<string, WeightEntry>();
  for (const e of raw) {
    if (!e || typeof e.date !== 'string') continue;
    const weight = Number(e.weight);
    if (!e.date || Number.isNaN(weight)) continue;
    byDate.set(e.date, entryOf(e.date, roundWeight(weight), cleanNote(e.note), cleanTags(e.tags)));
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * What to change besides the weight. For each field, `undefined` keeps what
 * the day already has; a value replaces it; `null` (or empty) removes it.
 */
export interface EntryExtras {
  note?: string | null;
  tags?: CategoryId[] | null;
}

/**
 * Insert or update a single measurement (upsert keyed on date), returning a new
 * sorted array and whether the action was an add or an update.
 */
export function upsertEntry(
  entries: WeightEntry[],
  date: string,
  weight: number,
  extras: EntryExtras = {},
): { entries: WeightEntry[]; action: 'added' | 'updated' } {
  const w = roundWeight(weight);
  const current = entries.find((e) => e.date === date);
  const note = extras.note === undefined ? current?.note : cleanNote(extras.note ?? '');
  const tags = extras.tags === undefined ? cleanTags(current?.tags) : cleanTags(extras.tags ?? []);
  const entry = entryOf(date, w, note, tags);
  const next = current ? entries.map((e) => (e.date === date ? entry : e)) : [...entries, entry];
  next.sort((a, b) => a.date.localeCompare(b.date));
  return { entries: next, action: current ? 'updated' : 'added' };
}

/** Remove the entry for a given date, returning a new array. */
export function removeEntry(entries: WeightEntry[], date: string): WeightEntry[] {
  return entries.filter((e) => e.date !== date);
}
