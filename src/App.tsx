import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useSync } from '@/hooks/useSync';
import { useAppBadge } from '@/hooks/useAppBadge';
import { useRoute } from '@/hooks/useRoute';
import { useIsDesktop } from '@/hooks/useViewport';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { LoadingState } from '@/components/states/LoadingState';
import { LoadError } from '@/components/states/LoadError';
import { LogForm } from '@/features/log/LogForm';
import { TodayScreen } from '@/screens/TodayScreen';
import { LogScreen } from '@/screens/LogScreen';
import { GoalScreen } from '@/screens/GoalScreen';
import { DataScreen } from '@/screens/DataScreen';

const SCREENS = { today: TodayScreen, log: LogScreen, goal: GoalScreen, data: DataScreen };

/**
 * Shell: sidebar from 1024px, a top bar with a menu below it. On phones and
 * tablets the log bar is fixed to the bottom, within thumb reach, on every
 * screen; the content leaves room for it and for the safe areas.
 */
export default function App() {
  const t = useT();
  const hydrated = useStore((s) => s.hydrated);
  const loadError = useStore((s) => s.loadError);
  const hydrate = useStore((s) => s.hydrate);
  const { theme } = useTheme();
  const route = useRoute();
  const desktop = useIsDesktop();
  const Screen = SCREENS[route];

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Cloud sync (no-op when Firebase isn't configured or in a dev-seed session).
  useSync();
  useAppBadge();

  return (
    <div className="flex min-h-screen bg-ground text-text">
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[60] rounded-full bg-primary px-4 py-2 text-sm text-on-primary"
      >
        {t.skipToContent}
      </a>
      <Sidebar route={route} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main
          id="main"
          className="mx-auto flex w-full max-w-column flex-col gap-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 sm:gap-5 lg:gap-4 lg:pb-16 lg:pt-9"
          style={{
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
          }}
        >
          {!hydrated ? <LoadingState /> : loadError ? <LoadError /> : <Screen />}
        </main>
      </div>
      {hydrated && !loadError && <LogForm variant="bar" />}
      <Toaster
        position={desktop ? 'bottom-right' : 'bottom-center'}
        offset={desktop ? 24 : 96}
        theme={theme}
        closeButton
        toastOptions={{
          classNames: {
            toast: '!rounded-inner !border-border !bg-surface !text-text !text-[15px] !font-sans',
            actionButton: '!bg-primary !text-on-primary !rounded-full !h-9 !px-4 !text-sm',
          },
        }}
      />
    </div>
  );
}
