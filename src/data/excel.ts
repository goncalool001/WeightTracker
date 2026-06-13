import * as XLSX from 'xlsx';
import { parse } from 'date-fns';
import { SHEET_DAILY, SHEET_WEEKLY } from '@/lib/constants';
import { normalizeEntries, weeklyAverages } from '@/domain';
import { formatDate } from '@/lib/format';
import type { WeightEntry } from '@/types';

/**
 * Excel import/export, fully compatible with the original desktop app's
 * two-sheet schema ("Daily Data" + "Weekly Averages").
 */

/** Coerce an Excel cell (date string, ISO, or serial number) to `YYYY-MM-DD`. */
function cellToISO(value: unknown): string | null {
  if (value == null) return null;

  // SheetJS with cellDates:true yields JS Date objects.
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const m = String(parsed.m).padStart(2, '0');
    const d = String(parsed.d).padStart(2, '0');
    return `${parsed.y}-${m}-${d}`;
  }

  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  // Fall back to a few common human formats.
  for (const fmt of ['dd MMM yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy']) {
    const d = parse(str, fmt, new Date());
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }
  }
  return null;
}

/**
 * Parse an uploaded workbook into normalised entries. Case-insensitive column
 * matching and graceful handling of missing columns mirror the desktop loader.
 */
export async function importWorkbook(file: File): Promise<WeightEntry[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { cellDates: true });

  // Prefer the canonical sheet; otherwise fall back to the first sheet.
  const sheetName = wb.SheetNames.includes(SHEET_DAILY)
    ? SHEET_DAILY
    : wb.SheetNames[0];
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets[sheetName],
    { defval: null },
  );
  if (rows.length === 0) return [];

  // Resolve the date/weight columns case-insensitively.
  const keys = Object.keys(rows[0]);
  const dateKey = keys.find((k) => k.trim().toLowerCase() === 'date');
  const weightKey = keys.find((k) => k.trim().toLowerCase() === 'weight');
  if (!dateKey || !weightKey) return [];

  const parsed: WeightEntry[] = [];
  for (const row of rows) {
    const iso = cellToISO(row[dateKey]);
    const weight = Number(row[weightKey]);
    if (iso && !Number.isNaN(weight)) parsed.push({ date: iso, weight });
  }
  return normalizeEntries(parsed);
}

/** Build a workbook (Blob) with the daily + derived weekly sheets. */
export function buildWorkbookBlob(entries: WeightEntry[]): Blob {
  const wb = XLSX.utils.book_new();

  const daily = XLSX.utils.json_to_sheet(
    entries.map((e) => ({ Date: e.date, Weight: e.weight })),
    { header: ['Date', 'Weight'] },
  );
  XLSX.utils.book_append_sheet(wb, daily, SHEET_DAILY);

  const weekly = XLSX.utils.json_to_sheet(
    weeklyAverages(entries).map((w) => ({
      'Week Start': w.weekStart,
      'Week End': w.weekEnd,
      'Average Weight': w.averageWeight,
      Measurements: w.measurements,
    })),
    { header: ['Week Start', 'Week End', 'Average Weight', 'Measurements'] },
  );
  XLSX.utils.book_append_sheet(wb, weekly, SHEET_WEEKLY);

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** Trigger a browser download of the current data as an `.xlsx` file. */
export function downloadWorkbook(entries: WeightEntry[]): void {
  const blob = buildWorkbookBlob(entries);
  const url = URL.createObjectURL(blob);
  const today = formatDate(new Date().toISOString().slice(0, 10)).replace(
    / /g,
    '-',
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `weight_data_${today}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
