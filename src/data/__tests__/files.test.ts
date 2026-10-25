// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { NoColumnsError, entriesToCsv, readRawRows } from '@/data/files';
import { getT } from '@/i18n';
import { buildImportPreview } from '@/domain';
import { SEED_ENTRIES } from '@/data/seed';

/** Node's File has text() and arrayBuffer(); jsdom's does not. */
function fileOf(name: string, data: BlobPart, type: string): File {
  return new File([data], name, { type });
}

describe('readRawRows', () => {
  it('reads an XLSX shaped like the export (sheet "Daily Data", Date as text)', async () => {
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(
      SEED_ENTRIES.map((e) => ({ Date: e.date, Weight: e.weight })),
      { header: ['Date', 'Weight'] },
    );
    XLSX.utils.book_append_sheet(wb, sheet, 'Daily Data');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const rows = await readRawRows(fileOf('weight_data.xlsx', buf, 'application/octet-stream'));
    expect(rows).toHaveLength(133);
    const p = buildImportPreview(rows, [], '2026-10-25');
    expect(p.counts).toMatchObject({ total: 133, rejected: 0, new: 133 });
  });

  it('reads a semicolon CSV with Portuguese headers and decimal commas', async () => {
    const csv = 'Data;Peso\n25/10/2026;76,5\n24/10/2026;77,5\n24/10/2026;77\n2026-13-01;70\n';
    const rows = await readRawRows(fileOf('pesos.csv', csv, 'text/csv'));
    expect(rows).toHaveLength(4);
    const p = buildImportPreview(rows, SEED_ENTRIES, '2026-10-25');
    expect(p.counts).toMatchObject({ same: 2, duplicate: 1, badDate: 1 });
  });

  it('refuses a file without Date and Weight columns', async () => {
    await expect(readRawRows(fileOf('x.csv', 'a,b\n1,2\n', 'text/csv'))).rejects.toBeInstanceOf(
      NoColumnsError,
    );
  });
});

describe('categories in export and import', () => {
  const entries = [
    { date: '2026-10-24', weight: 77.5, tags: ['clean_day', 'cardio'], note: 'jantar, com amigos' },
    { date: '2026-10-25', weight: 76.5, tags: ['alcohol', 'social'] },
    { date: '2026-10-26', weight: 76.4 },
  ];

  it('exports categories as labels in the current language, quoted when needed', () => {
    const csv = entriesToCsv(entries, getT('pt'));
    expect(csv.split('\n')[0]).toBe('Date,Weight,Categories,Note');
    expect(csv).toContain('2026-10-24,77.5,"Dia limpo, dentro do plano; Cardio","jantar, com amigos"');
    expect(csv).toContain('2026-10-25,76.5,Álcool; Evento social,');
  });

  it('reads them back, in either language, to the same categories', async () => {
    for (const loc of ['pt', 'en'] as const) {
      const csv = entriesToCsv(entries, getT(loc));
      const rows = await readRawRows(fileOf('export.csv', csv, 'text/csv'));
      const p = buildImportPreview(rows, [], '2026-10-26');
      expect(p.valid.map((e) => e.tags)).toEqual([['clean_day', 'cardio'], ['alcohol', 'social'], undefined]);
      expect(p.valid[0].note).toBe('jantar, com amigos');
    }
  });
});
