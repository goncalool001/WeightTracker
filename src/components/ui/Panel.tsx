import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  title: string;
  /** Heading level inside the screen (default h2). */
  level?: 2 | 3;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id: string;
}

/** A tonal panel with a section heading and optional controls on the right. */
export function Panel({ title, level = 2, actions, children, className, id }: PanelProps) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <section aria-labelledby={id} className={cn('panel flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <H id={id} className="text-[15px] font-semibold text-text lg:text-sm">
          {title}
        </H>
        {actions}
      </div>
      {children}
    </section>
  );
}
