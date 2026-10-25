import { useStore } from '@/store/useStore';
import { Segmented } from '@/components/ui/Segmented';
import type { Locale } from '@/types';

const LANG_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
];

/** Language switcher (EN / PT) for the header. */
export function LanguagePicker() {
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  return (
    <Segmented
      ariaLabel="Language"
      options={LANG_OPTIONS}
      value={locale}
      onChange={setLocale}
    />
  );
}
