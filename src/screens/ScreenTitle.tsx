import { cn } from '@/lib/cn';

/**
 * The screen's h1 and an optional grey line under it. Today keeps its h1 for
 * screen readers only (the cards say it all) and shows it, as a serif
 * sentence, only in the empty state. The h1 takes focus on navigation so
 * screen readers announce the screen.
 */
export function ScreenTitle({
  title,
  sub,
  serif,
  hidden,
}: {
  title: string;
  sub?: string;
  serif?: boolean;
  hidden?: boolean;
}) {
  if (hidden && !sub) {
    return (
      <h1 tabIndex={-1} className="sr-only">
        {title}
      </h1>
    );
  }
  return (
    <header className="flex flex-col gap-2 pt-1 lg:pt-4">
      <h1
        tabIndex={-1}
        className={cn(
          'text-balance text-text outline-none',
          hidden && 'sr-only',
          serif
            ? 'font-serif text-[26px] leading-[1.15] tracking-[-0.01em] sm:text-[30px] lg:text-[32px]'
            : 'text-[24px] font-semibold leading-tight lg:text-[28px]',
        )}
      >
        {title}
      </h1>
      {sub && <p className="text-[15px] text-muted lg:text-base">{sub}</p>}
    </header>
  );
}
