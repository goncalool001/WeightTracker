import { Activity } from 'lucide-react';
import { APP_TITLE } from '@/lib/constants';
import { FileControls } from '@/features/file/FileControls';
import { AuthControl } from '@/features/auth/AuthControl';
import { ThemeToggle } from './ThemeToggle';

/** Sticky app header: brand, Excel import/export, theme toggle. */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Activity className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </span>
          <h1 className="text-base font-bold tracking-tight text-text">
            {APP_TITLE}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <FileControls />
          <AuthControl />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
