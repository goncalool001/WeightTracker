import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Segmented } from '@/components/ui/Segmented';
import type { Locale } from '@/types';

/** EN / PT switch. */
export function LanguagePicker() {
  const t = useT();
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  return (
    <Segmented<Locale>
      ariaLabel={t.language}
      value={locale}
      onChange={setLocale}
      options={[
        { value: 'en', label: 'EN' },
        { value: 'pt', label: 'PT' },
      ]}
    />
  );
}
