import { Database, Home, List, Target, type LucideIcon } from 'lucide-react';
import { useT } from '@/i18n';
import { routeHref } from '@/hooks/useRoute';
import { cn } from '@/lib/cn';
import type { Route } from '@/types';

const ITEMS: { route: Route; icon: LucideIcon }[] = [
  { route: 'today', icon: Home },
  { route: 'log', icon: List },
  { route: 'goal', icon: Target },
  { route: 'data', icon: Database },
];

/** The four screens. The active one sits on a neutral grey pill. */
export function Nav({ route, onNavigate, large }: { route: Route; onNavigate?: () => void; large?: boolean }) {
  const t = useT();
  return (
    <nav aria-label={t.navLabel}>
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map(({ route: r, icon: Icon }) => {
          const active = r === route;
          return (
            <li key={r}>
              <a
                href={routeHref(r)}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 transition-colors',
                  large ? 'h-12 text-[17px]' : 'h-9 text-sm',
                  active
                    ? 'border-border bg-nav-active font-medium text-text'
                    : 'border-transparent text-muted hover:bg-nav-active hover:text-text',
                )}
              >
                <Icon className={large ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.75} aria-hidden="true" />
                {t.nav[r]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
