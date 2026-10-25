import * as XLSX from 'xlsx';
import { parse } from 'date-fns';
import { SHEET_DAILY } from '@/lib/constants';
import { normalizeEntries } from '@/domain';
import { formatDate } from '@/lib/format';
import type { WeightEntry } from '@/types';

/**
 * Excel import/export. The workbook is a single sheet with `Date` and `Weight`
 * columns. Import is tolerant: it scans every sheet (regardless of name) for the
 * first one that has Date + Weight columns and matches them case-insensitively.
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
 * Parse an uploaded workbook into normalised entries. Sheet names are ignored:
 * every sheet is scanned and the first one exposing both a Date and a Weight
 * column (matched case-insensitively) is used.
 */
export async function importWorkbook(file: File): Promise<WeightEntry[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { cellDates: true });

  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      wb.Sheets[name],
      { defval: null },
    );
    if (rows.length === 0) continue;

    // Resolve the date/weight columns case-insensitively on this sheet.
    const keys = Object.keys(rows[0]);
    const dateKey = keys.find((k) => k.trim().toLowerCase() === 'date');
    const weightKey = keys.find((k) => k.trim().toLowerCase() === 'weight');
    if (!dateKey || !weightKey) continue; // not the data sheet — keep looking

    const parsed: WeightEntry[] = [];
    for (const row of rows) {
      const iso = cellToISO(row[dateKey]);
      const weight = Number(row[weightKey]);
      if (iso && !Number.isNaN(weight)) parsed.push({ date: iso, weight });
    }
    return normalizeEntries(parsed);
  }

  return []; // no sheet had Date + Weight columns
}

/** Build a single-sheet workbook (Blob) with `Date` and `Weight` columns. */
export function buildWorkbookBlob(entries: WeightEntry[]): Blob {
  const wb = XLSX.utils.book_new();

  const sheet = XLSX.utils.json_to_sheet(
    entries.map((e) => ({ Date: e.date, Weight: e.weight })),
    { header: ['Date', 'Weight'] },
  );
  XLSX.utils.book_append_sheet(wb, sheet, SHEET_DAILY);

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
