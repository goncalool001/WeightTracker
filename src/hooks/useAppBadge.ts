import { useEffect } from 'react';
import { todayISO } from '@/domain';
import { useStore } from '@/store/useStore';

type BadgingNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * A dot on the installed app's icon while today has no weigh-in (Badging API;
 * Chrome, Edge and Safari 16.4+ when installed). It is checked whenever the
 * data changes and whenever the app comes back to the foreground, so a new
 * day shows the dot the next time the app is opened. No server, no push:
 * where the API is missing nothing happens.
 */
export function useAppBadge(): void {
  const entries = useStore((s) => s.entries);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    const nav = navigator as BadgingNavigator;
    if (!hydrated || !nav.setAppBadge || !nav.clearAppBadge) return;

    const update = () => {
      const today = todayISO();
      const done = entries.some((e) => e.date === today);
      void (done ? nav.clearAppBadge!() : nav.setAppBadge!()).catch(() => {});
    };
    update();
    const onVisible = () => document.visibilityState === 'visible' && update();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [entries, hydrated]);
}
