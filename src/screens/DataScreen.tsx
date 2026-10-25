import { useId, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseReady } from '@/data/firebase';
import { downloadCsv, downloadXlsx } from '@/data/files';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AuthControl } from '@/features/auth/AuthControl';
import { ImportPanel } from '@/features/data/ImportPanel';
import { replaceAll } from '@/features/log/actions';
import { ScreenTitle } from './ScreenTitle';

/** Data: import, export, account and sync, and deleting everything (last). */
export function DataScreen() {
  const t = useT();
  const ids = { exp: useId(), acc: useId(), danger: useId() };
  const entries = useStore((s) => s.entries);
  const user = useStore((s) => s.user);
  const [confirm, setConfirm] = useState(false);

  function exportAs(kind: 'xlsx' | 'csv') {
    if (entries.length === 0) {
      toast(t.nothingToExport);
      return;
    }
    const name = kind === 'xlsx' ? downloadXlsx(entries, t) : downloadCsv(entries, t);
    toast(t.tExported(name));
  }

  const label = (id: string, title: string, desc: string) => (
    <div className="lg:col-span-4 lg:pt-5">
      <h2 id={id} className="text-[17px] font-semibold text-text lg:text-base">
        {title}
      </h2>
      <p className="mt-1 text-[15px] text-muted lg:text-sm">{desc}</p>
    </div>
  );

  return (
    <>
      <ScreenTitle title={t.dataTitle} />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <ImportPanel />

        {label(ids.exp, t.exportTitle, t.exportDesc(entries.length))}
        <section aria-labelledby={ids.exp} className="panel flex flex-wrap gap-2 p-4 sm:p-5 lg:col-span-8">
          <Button onClick={() => exportAs('xlsx')}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.exportXlsx}
          </Button>
          <Button onClick={() => exportAs('csv')}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.exportCsv}
          </Button>
        </section>

        {label(
          ids.acc,
          t.accountTitle,
          !firebaseReady ? t.accountOff : user ? t.accountDescIn(user.email ?? user.name ?? '') : t.accountDescOut,
        )}
        <section aria-labelledby={ids.acc} className="panel p-4 sm:p-5 lg:col-span-8">
          <div className="max-w-sm">
            <AuthControl />
          </div>
        </section>

        {label(ids.danger, t.dangerTitle, t.dangerDesc(entries.length))}
        <section aria-labelledby={ids.danger} className="panel p-4 sm:p-5 lg:col-span-8">
          <Button variant="danger" onClick={() => setConfirm(true)} disabled={entries.length === 0}>
            {t.deleteAll}
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={confirm}
        title={t.deleteAllTitle}
        description={t.deleteAllDesc(entries.length)}
        confirmLabel={t.deleteAll}
        cancelLabel={t.cancel}
        destructive
        onConfirm={() => replaceAll([], t.tDeletedAll(entries.length), t)}
        onOpenChange={setConfirm}
      />
    </>
  );
}
