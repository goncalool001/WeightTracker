import { useId, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import {
  applyImport,
  buildImportPreview,
  todayISO,
  type CheckedRow,
  type ImportPreview,
} from '@/domain';
import { NoColumnsError, readRawRows } from '@/data/files';
import { kg } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { replaceAll } from '@/features/log/actions';

const VALID_SHOWN = 8;

/**
 * Import a CSV or XLSX: read, validate every row, show what will happen
 * (new, changed, unchanged, left out and why), then save with undo.
 */
export function ImportPanel() {
  const t = useT();
  const ids = { title: useId(), mode: useId() };
  const entries = useStore((s) => s.entries);
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const raw = await readRawRows(f);
      const p = buildImportPreview(raw, entries, todayISO());
      setFile(f.name);
      if (p.valid.length === 0) setError(t.nothingValid);
      setPreview(p);
    } catch (err) {
      setError(err instanceof NoColumnsError ? t.noColumns : t.readFailed);
    } finally {
      setBusy(false);
    }
  }

  /** Rows that change something: all of them on replace, new + changed on merge. */
  const saveCount = (p: ImportPreview) =>
    mode === 'replace' ? p.valid.length : p.counts.new + p.counts.changed;

  function onSave() {
    if (!preview) return;
    const next = applyImport(entries, preview.valid, mode);
    replaceAll(next, t.tImported(saveCount(preview)), t);
    setPreview(null);
    setFile(null);
  }

  const rejected = preview?.rows.filter((r) => r.issue) ?? [];
  const accepted = preview?.rows.filter((r) => !r.issue) ?? [];
  const status = (r: CheckedRow) =>
    r.change === 'new'
      ? t.changeNew
      : r.change === 'same'
        ? t.changeSame
        : r.previous != null
          ? t.changeFrom(kg(r.previous))
          : '';

  return (
    <>
      <div className="lg:col-span-4 lg:pt-5">
        <h2
          id={ids.title}
          className="text-[17px] font-semibold text-text lg:text-base"
        >
          {t.importTitle}
        </h2>
        <p className="mt-1 text-[15px] text-muted lg:text-sm">{t.importDesc}</p>
      </div>
      <section
        aria-labelledby={ids.title}
        className="panel flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:col-span-8"
      >
        <input
          ref={input}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv"
          className="sr-only"
          tabIndex={-1}
          onChange={onFile}
          aria-hidden="true"
        />
        <Button
          className="self-start"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t.chooseFile}
        </Button>

        {error && (
          <p role="alert" className="text-[15px] text-negative lg:text-sm">
            {error}
          </p>
        )}

        {preview && preview.valid.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <h3 className="text-[15px] font-semibold text-text lg:text-sm">
              {t.previewOf(file ?? '')}
            </h3>
            <ul
              className="flex flex-wrap gap-2 text-[13px]"
              aria-label={t.pTotal(preview.counts.total)}
            >
              <li className="rounded-full bg-active px-3 py-1 text-text">
                {t.pTotal(preview.counts.total)}
              </li>
              <li className="rounded-full bg-pill-pos px-3 py-1 text-pill-pos-ink">
                {t.pNew(preview.counts.new)}
              </li>
              <li className="rounded-full bg-pill-warn px-3 py-1 text-pill-warn-ink">
                {t.pChanged(preview.counts.changed)}
              </li>
              <li className="rounded-full bg-active px-3 py-1 text-text">
                {t.pSame(preview.counts.same)}
              </li>
              {preview.counts.rejected > 0 && (
                <li className="rounded-full bg-pill-neg px-3 py-1 text-pill-neg-ink">
                  {t.pRejected(preview.counts.rejected)}
                </li>
              )}
            </ul>

            {rejected.length > 0 && (
              <div>
                <h4 className="mb-1 text-[14px] font-medium text-text">
                  {t.rejectedTitle}
                </h4>
                <RowsTable
                  rows={rejected}
                  status={(r) => (r.issue ? t.issue[r.issue] : '')}
                  t={t}
                  danger
                />
              </div>
            )}

            <div>
              <h4 className="mb-1 text-[14px] font-medium text-text">
                {t.validTitle}
              </h4>
              <RowsTable
                rows={accepted.slice(0, VALID_SHOWN)}
                status={status}
                t={t}
              />
              {accepted.length > VALID_SHOWN && (
                <p className="mt-1 text-[13px] text-muted">
                  + {accepted.length - VALID_SHOWN}
                </p>
              )}
            </div>

            <fieldset>
              <legend id={ids.mode} className="sr-only">
                {t.modeMerge} / {t.modeReplace}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['merge', 'replace'] as const).map((m) => (
                  <label
                    key={m}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-inner border p-3',
                      mode === m ? 'border-text bg-raised' : 'border-control',
                    )}
                  >
                    <input
                      type="radio"
                      name="import-mode"
                      value={m}
                      checked={mode === m}
                      onChange={() => setMode(m)}
                      className="mt-1 h-4 w-4 accent-[var(--text)]"
                    />
                    <span>
                      <span className="block text-[15px] font-medium text-text lg:text-sm">
                        {m === 'merge' ? t.modeMerge : t.modeReplace}
                      </span>
                      <span className="block text-[14px] text-muted lg:text-[13px]">
                        {m === 'merge'
                          ? t.modeMergeDesc
                          : t.modeReplaceDesc(entries.length)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={onSave}>
                {t.saveImport(saveCount(preview))}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function RowsTable({
  rows,
  status,
  t,
  danger,
}: {
  rows: CheckedRow[];
  status: (r: CheckedRow) => string;
  t: ReturnType<typeof useT>;
  danger?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-[14px] lg:text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th scope="col" className="h-9 pr-3 font-normal">
              {t.colRow}
            </th>
            <th scope="col" className="h-9 pr-3 font-normal">
              {t.colDate}
            </th>
            <th scope="col" className="h-9 pr-3 text-right font-normal">
              {t.colWeight}
            </th>
            <th scope="col" className="h-9 font-normal">
              {t.colStatus}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.row} className="border-b border-rule last:border-b-0">
              <td className="num h-10 pr-3 text-muted">{r.row}</td>
              <td className="num h-10 pr-3 text-text">
                {r.date ? t.fmtDate(r.date) : r.rawDate || '—'}
              </td>
              <td className="num h-10 pr-3 text-right text-text">
                {r.weight != null ? kg(r.weight) : r.rawWeight || '—'}
              </td>
              <td
                className={cn('h-10', danger ? 'text-negative' : 'text-muted')}
              >
                {status(r)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
