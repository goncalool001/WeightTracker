import { AlertCircle } from 'lucide-react';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';

/** Shown in place of the data when the local store could not be read. */
export function LoadError() {
  const t = useT();
  const hydrate = useStore((s) => s.hydrate);
  return (
    <div role="alert" className="panel flex flex-col items-start gap-3 p-5">
      <p className="flex items-start gap-2 text-[15px] font-medium text-text">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden="true" />
        {t.loadErrorTitle}
      </p>
      <p className="text-[15px] text-muted">{t.loadErrorDesc}</p>
      <button
        type="button"
        onClick={() => void hydrate()}
        className="h-11 rounded-full border border-control px-4 text-sm font-medium text-text hover:bg-active lg:h-9"
      >
        {t.retry}
      </button>
    </div>
  );
}
