import { useEffect, useLayoutEffect } from 'react';
import { useStore } from '@/store/useStore';
import type { Theme } from '@/types';

/**
 * Applies the active theme to the document root (toggling the `.dark` class),
 * keeps the browser theme-color meta in sync, and sets the page language.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useStore((s) => s.theme);
  const locale = useStore((s) => s.locale);
  const setTheme = useStore((s) => s.setTheme);

  // A layout effect, so the class is on <html> before any child effect (the
  // charts) reads the colour tokens.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'dark' ? '#111110' : '#ebebe6');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-PT' : 'en';
  }, [locale]);

  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
