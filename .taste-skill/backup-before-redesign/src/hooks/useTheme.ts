import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import type { Theme } from '@/types';

/**
 * Applies the active theme to the document root (toggling the `.dark` class)
 * and keeps the browser theme-color meta in sync. Returns the current theme
 * plus a toggle.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#1a1d2e' : '#f4f6fa');
    }
  }, [theme]);

  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
