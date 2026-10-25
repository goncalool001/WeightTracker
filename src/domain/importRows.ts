import { WEIGHT_MAX, WEIGHT_MIN } from '@/lib/constants';
import { isoFromDay } from './calendar';
import { cleanNote, normalizeEntries, roundWeight } from './entries';
import { cleanTags } from './categories';
import type { WeightEntry } from '@/types';

/**
 * Validation for imported rows (CSV or XLSX). Pure: the file layer turns a
 * file into raw cells, this decides which rows are usable and why the others
 * are not, and how the usable ones compare with the data already saved.
 */

export interface RawRow {
  /** 1-based row number in the file, counting the header as row 1. */
  row: number;
  date: unknown;
  weight: unknown;
  /** Optional note column. */
  note?: unknown;
  /** Optional categories, already resolved to ids. */
  tags?: string[];
}

export type RowIssue = 'badDate' | 'badWeight' | 'outOfRange' | 'duplicate' | 'future';
export type RowChange = 'new' | 'changed' | 'same';

export interface CheckedRow {
  row: number;
  /** The cell as it appeared, for the preview. */
  rawDate: string;
  rawWeight: string;
  date: string | null;
  weight: number | null;
  note?: string;
  tags?: string[];
  issue: RowIssue | null;
  change: RowChange | null;
  /** The saved weight for that date, when there is one. */
  previous: number | null;
}

export interface ImportPreview {
  rows: CheckedRow[];
  /** Usable entries, sorted. */
  valid: WeightEntry[];
  counts: Record<RowIssue | RowChange, number> & { total: number; rejected: number };
}

/** True when y-m-d is a real calendar date. */
function realDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

const pad = (n: number) => String(n).padStart(2, '0');

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, may: 5, mai: 5, jun: 6,
  jul: 7, aug: 8, ago: 8, sep: 9, set: 9, oct: 10, out: 10, nov: 11, dec: 12, dez: 12,
};

/**
 * A date cell to ISO. Accepts JS dates (from SheetJS), Excel serial numbers,
 * `YYYY-MM-DD` (also with / or .), `DD/MM/YYYY` (also - or .) and
 * `25 Oct 2026` / `25 out 2026`. Day-first is assumed for slashed dates.
 */
export function parseDateCell(value: unknown): string | null {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  if (typeof value === 'number') {
    // Excel serial: day 25569 is 1970-01-01.
    if (!Number.isFinite(value) || value < 1 || value > 120000) return null;
    return isoFromDay(Math.floor(value) - 25569);
  }

  const s = String(value).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T ].*)?$/);
  if (m) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    return realDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const [d, mo, y] = [+m[1], +m[2], +m[3]];
    return realDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  m = s.match(/^(\d{1,2})[\s-]+([A-Za-zçÇ]{3})[a-zç.]*[\s-]+(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase()];
    const [d, y] = [+m[1], +m[3]];
    return mo && realDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  return null;
}

/** A weight cell to kg. Accepts numbers, "76.5", "76,5" and "76.5 kg". */
export function parseWeightCell(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = String(value).trim().replace(/\s*kg$/i, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function cellText(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return parseDateCell(value) ?? String(value);
  return String(value).trim();
}

/**
 * Check every row and compare the usable ones with `existing`. The first row
 * for a date wins; later rows for the same date are reported as duplicates.
 * Dates after `today` are rejected.
 */
export function buildImportPreview(
  raw: RawRow[],
  existing: WeightEntry[],
  today: string,
): ImportPreview {
  const saved = new Map(existing.map((e) => [e.date, e.weight]));
  const seen = new Set<string>();
  const rows: CheckedRow[] = [];

  for (const r of raw) {
    const date = parseDateCell(r.date);
    const w = parseWeightCell(r.weight);
    const row: CheckedRow = {
      row: r.row,
      rawDate: cellText(r.date),
      rawWeight: cellText(r.weight),
      date,
      weight: w == null ? null : roundWeight(w),
      note: cleanNote(r.note == null ? undefined : String(r.note)),
      tags: cleanTags(r.tags),
      issue: null,
      change: null,
      previous: date != null ? (saved.get(date) ?? null) : null,
    };
    if (!date) row.issue = 'badDate';
    else if (w == null) row.issue = 'badWeight';
    else if (w < WEIGHT_MIN || w > WEIGHT_MAX) row.issue = 'outOfRange';
    else if (date > today) row.issue = 'future';
    else if (seen.has(date)) row.issue = 'duplicate';

    if (!row.issue && date) {
      seen.add(date);
      row.change =
        row.previous == null ? 'new' : row.previous === row.weight ? 'same' : 'changed';
    }
    rows.push(row);
  }

  const counts = {
    total: rows.length,
    rejected: 0,
    badDate: 0,
    badWeight: 0,
    outOfRange: 0,
    duplicate: 0,
    future: 0,
    new: 0,
    changed: 0,
    same: 0,
  };
  for (const r of rows) {
    if (r.issue) {
      counts.rejected++;
      counts[r.issue]++;
    } else if (r.change) counts[r.change]++;
  }

  const valid = normalizeEntries(
    rows
      .filter((r) => !r.issue && r.date && r.weight != null)
      .map((r) => ({ date: r.date as string, weight: r.weight as number, note: r.note, tags: r.tags })),
  );
  return { rows, valid, counts };
}

/** Saved data after an import: merged over the existing rows, or replacing them. */
export function applyImport(
  existing: WeightEntry[],
  valid: WeightEntry[],
  mode: 'merge' | 'replace',
): WeightEntry[] {
  if (mode === 'replace') return normalizeEntries(valid);
  // A row without a note or categories keeps what the day already had.
  const prev = new Map(existing.map((e) => [e.date, e]));
  const incoming = valid.map((e) => ({
    ...e,
    note: e.note ?? prev.get(e.date)?.note,
    tags: e.tags ?? prev.get(e.date)?.tags,
  }));
  return normalizeEntries([...existing, ...incoming]);
}
