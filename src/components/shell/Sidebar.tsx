import { useT } from '@/i18n';
import { routeHref } from '@/hooks/useRoute';
import { AuthControl } from '@/features/auth/AuthControl';
import { LanguagePicker } from '@/components/layout/LanguagePicker';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Mark } from './Mark';
import { Nav } from './Nav';
import type { Route } from '@/types';

/**
 * Desktop shell (≥1024px): an open-plane sidebar on the page ground with one
 * hairline, the product's mark and name on top, settings and the account at
 * the bottom.
 */
export function Sidebar({ route }: { route: Route }) {
  const t = useT();
  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-border px-3 pb-5 pt-7 lg:flex">
      <a href={routeHref('today')} className="mb-8 flex items-center gap-2.5 px-3 text-[15px] font-semibold text-text">
        <Mark size={24} />
        {t.appName}
      </a>
      <Nav route={route} />
      <div className="mt-auto flex flex-col gap-3 px-3">
        <div className="flex flex-wrap gap-2">
          <LanguagePicker />
          <ThemeToggle />
        </div>
        <AuthControl />
      </div>
    </aside>
  );
}
