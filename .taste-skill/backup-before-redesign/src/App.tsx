import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useSync } from '@/hooks/useSync';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { LoadingState } from '@/features/dashboard/LoadingState';

export default function App() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const { theme } = useTheme();

  // Load persisted state (or seed) once on startup.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Cloud sync (no-op when Firebase isn't configured).
  useSync();

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main>{hydrated ? <Dashboard /> : <LoadingState />}</main>
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
      />
    </div>
  );
}
