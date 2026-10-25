import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { downloadWorkbook, importWorkbook } from '@/data/excel';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { WeightEntry } from '@/types';

/** Import / export controls for Excel interoperability. */
export function FileControls() {
  const t = useT();
  const entries = useStore((s) => s.entries);
  const replaceEntries = useStore((s) => s.replaceEntries);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<WeightEntry[] | null>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = await importWorkbook(file);
      if (imported.length === 0) {
        toast.error('No valid "Date"/"Weight" rows found in that file.');
        return;
      }
      setPending(imported);
    } catch {
      toast.error('Could not read that file. Is it a valid .xlsx?');
    }
  }

  function confirmImport() {
    if (!pending) return;
    replaceEntries(pending);
    toast.success(`Imported ${pending.length} entries.`);
    setPending(null);
  }

  function onExport() {
    if (entries.length === 0) {
      toast.error('Nothing to export yet.');
      return;
    }
    downloadWorkbook(entries);
    toast.success('Exported weight_data.xlsx');
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onFileSelected}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileInput.current?.click()}
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{t.importBtn}</span>
      </Button>
      <Button variant="secondary" size="sm" onClick={onExport}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t.exportBtn}</span>
      </Button>

      <ConfirmDialog
        open={pending !== null}
        title={t.replaceTitle}
        description={t.replaceDesc(entries.length, pending?.length ?? 0)}
        confirmLabel={t.replaceBtn}
        cancelLabel={t.cancelBtn}
        destructive
        onConfirm={confirmImport}
        onOpenChange={(o) => !o && setPending(null)}
      />
    </>
  );
}
