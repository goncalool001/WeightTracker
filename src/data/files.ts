import * as XLSX from 'xlsx';
import { SHEET_DAILY } from '@/lib/constants';
import type { RawRow } from '@/domain';
import { CATEGORY_IDS, cleanTags, type CategoryId } from '@/domain/categories';
import { getT, type T } from '@/i18n';
import type { WeightEntry } from '@/types';

/**
 * File import/export (CSV and XLSX). This layer only turns a file into raw
 * cells and back; deciding which rows are valid is `buildImportPreview`'s job.
 */

const DATE_HEADERS = ['date', 'data', 'dia', 'day'];
const WEIGHT_HEADERS = ['weight', 'peso', 'kg', 'weight (kg)', 'peso (kg)'];
const NOTE_HEADERS = ['note', 'notes', 'nota', 'notas'];
const TAG_HEADERS = ['categories', 'category', 'categorias', 'categoria', 'tags'];

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

/** Find the date and weight columns (and an optional note column) in a header row. */
function findColumns(header: unknown[]): { d: number; w: number; n: number; c: number } | null {
  const h = header.map(norm);
  const d = h.findIndex((x) => DATE_HEADERS.includes(x));
  const w = h.findIndex((x) => WEIGHT_HEADERS.includes(x));
  const n = h.findIndex((x) => NOTE_HEADERS.includes(x));
  const c = h.findIndex((x) => TAG_HEADERS.includes(x));
  return d >= 0 && w >= 0 ? { d, w, n, c } : null;
}

/** Split one CSV line, honouring double quotes. */
function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === sep && !quoted) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const BOM = new RegExp(`^${String.fromCharCode(0xfeff)}`);

function rowsFromCsv(text: string): unknown[][] {
  const lines = text.replace(BOM, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const first = lines[0];
  const sep = [';', '\t', ','].find((s) => first.includes(s)) ?? ',';
  return lines.map((l) => splitCsvLine(l, sep));
}

/** Category label (EN or PT, any case) or id → id. */
const TAG_LOOKUP = (() => {
  const m = new Map<string, CategoryId>();
  for (const id of CATEGORY_IDS) {
    m.set(id, id);
    for (const loc of ['en', 'pt'] as const) m.set(getT(loc).cat[id].toLowerCase(), id);
  }
  return m;
})();

/** A categories cell ("Very salty; Alcohol") to ids; unknown names are dropped. */
function parseTagCell(v: unknown): CategoryId[] | undefined {
  if (v == null || v === '') return undefined;
  const ids = String(v)
    // Only ";" (and "|") separate categories: some labels contain a comma.
    .split(/[;|]/)
    .map((s) => TAG_LOOKUP.get(s.trim().toLowerCase()))
    .filter((x): x is CategoryId => !!x);
  return ids.length ? ids : undefined;
}

/** The error a caller shows when a file has no Date and Weight columns. */
export class NoColumnsError extends Error {
  constructor() {
    super('no-columns');
  }
}

/**
 * Read a CSV or XLSX file into raw rows. For workbooks every sheet is scanned
 * and the first with Date and Weight columns (English or Portuguese headers,
 * any case) is used. Throws `NoColumnsError` when none is found.
 */
export async function readRawRows(file: File): Promise<RawRow[]> {
  let grid: unknown[][] = [];
  if (/\.csv$|\.txt$/i.test(file.name) || file.type === 'text/csv') {
    grid = rowsFromCsv(await file.text());
  } else {
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    for (const name of wb.SheetNames) {
      const sheet = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
        header: 1,
        defval: null,
        raw: true,
      });
      if (sheet.length > 0 && findColumns(sheet[0])) {
        grid = sheet;
        break;
      }
    }
  }
  const cols = grid.length > 0 ? findColumns(grid[0]) : null;
  if (!cols) throw new NoColumnsError();

  const rows: RawRow[] = [];
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i] ?? [];
    const date = r[cols.d];
    const weight = r[cols.w];
    if ((date == null || date === '') && (weight == null || weight === '')) continue;
    const note = cols.n >= 0 ? r[cols.n] : undefined;
    const tags = cols.c >= 0 ? parseTagCell(r[cols.c]) : undefined;
    rows.push({ row: i + 1, date, weight, note, tags });
  }
  return rows;
}

function stamp(): string {
  const d = new Date();
  const m = d.toLocaleString('en-GB', { month: 'short' });
  return `${String(d.getDate()).padStart(2, '0')}-${m}-${d.getFullYear()}`;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download the entries as `weight_data_<date>.xlsx` (sheet "Daily Data"). */
export function downloadXlsx(entries: WeightEntry[], t: T): string {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(
    entries.map((e) => ({ Date: e.date, Weight: e.weight, Categories: tagLabels(e, t), Note: e.note ?? '' })),
    { header: ['Date', 'Weight', 'Categories', 'Note'] },
  );
  XLSX.utils.book_append_sheet(wb, sheet, SHEET_DAILY);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const name = `weight_data_${stamp()}.xlsx`;
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    name,
  );
  return name;
}

/** A CSV field, quoted when it holds a comma, a quote or a line break. */
const csvField = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** Category labels in the current language, joined with "; ". */
const tagLabels = (e: WeightEntry, t: T) => (cleanTags(e.tags) ?? []).map((id) => t.cat[id]).join('; ');

/** The CSV text: Date,Weight,Categories,Note (categories as labels in the current language). */
export function entriesToCsv(entries: WeightEntry[], t: T): string {
  const rows = entries.map(
    (e) => `${e.date},${e.weight.toFixed(1)},${csvField(tagLabels(e, t))},${csvField(e.note ?? '')}`,
  );
  return ['Date,Weight,Categories,Note', ...rows].join('\n') + '\n';
}

/** Download the entries as `weight_data_<date>.csv` (Date,Weight,Categories,Note). */
export function downloadCsv(entries: WeightEntry[], t: T): string {
  const name = `weight_data_${stamp()}.csv`;
  download(new Blob([entriesToCsv(entries, t)], { type: 'text/csv;charset=utf-8' }), name);
  return name;
}
