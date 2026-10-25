import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Segmented } from '@/components/ui/Segmented';
import type { Theme } from '@/types';

/** Light / dark switch, with words rather than an icon. */
export function ThemeToggle() {
  const t = useT();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  return (
    <Segmented<Theme>
      ariaLabel={t.theme}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: t.themeLight },
        { value: 'dark', label: t.themeDark },
      ]}
    />
  );
}
