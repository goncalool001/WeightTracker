import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { useT } from '@/i18n';
import { routeHref } from '@/hooks/useRoute';
import { AuthControl } from '@/features/auth/AuthControl';
import { LanguagePicker } from '@/components/layout/LanguagePicker';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Mark } from './Mark';
import { Nav } from './Nav';
import type { Route } from '@/types';

/**
 * Phone and tablet shell (<1024px): a 48px bar with the mark, the product
 * name and a menu button; the menu opens a full-screen sheet with the
 * screens, language, theme and account.
 */
export function TopBar({ route }: { route: Route }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 border-b border-border bg-ground lg:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="flex h-12 items-center justify-between"
        style={{
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(4px, env(safe-area-inset-right))',
        }}
      >
        <a href={routeHref('today')} className="flex items-center gap-2 text-[16px] font-semibold text-text">
          <Mark size={22} />
          {t.appName}
          <span className="sr-only">· {t.nav[route]}</span>
        </a>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            aria-label={t.openMenu}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-active"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content
              className="fixed inset-0 z-50 flex animate-sheet-in flex-col overflow-y-auto bg-ground"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
              }}
            >
              <div className="flex h-12 items-center justify-between pl-4 pr-1">
                <Dialog.Title className="flex items-center gap-2 text-[16px] font-semibold text-text">
                  <Mark size={22} />
                  {t.appName}
                </Dialog.Title>
                <Dialog.Close
                  aria-label={t.closeMenu}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-active"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">{t.navLabel}</Dialog.Description>
              <div className="flex flex-1 flex-col gap-8 px-4 pt-4">
                <Nav route={route} onNavigate={() => setOpen(false)} large />
                <div className="flex flex-col gap-4 border-t border-border pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] text-muted">{t.language}</span>
                    <LanguagePicker />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] text-muted">{t.theme}</span>
                    <ThemeToggle />
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <AuthControl />
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
