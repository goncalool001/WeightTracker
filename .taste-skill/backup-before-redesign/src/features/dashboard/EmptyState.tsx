import { Scale } from 'lucide-react';
import { useT } from '@/i18n';

/** Shown when there is no data at all (e.g. after deleting everything). */
export function EmptyState() {
  const t = useT();
  return (
    <div className="card themed flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <Scale className="h-7 w-7" />
      </span>
      <h2 className="text-lg font-bold text-text">{t.noEntriesYet}</h2>
      <p className="max-w-sm text-sm text-muted">{t.noEntriesYetDesc}</p>
    </div>
  );
}
