import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** A titled content card with an optional actions slot in the header. */
export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section className={cn('card themed flex flex-col overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-bold text-text">{title}</h2>
        {actions}
      </header>
      <div className={cn('flex-1', bodyClassName)}>{children}</div>
    </section>
  );
}
