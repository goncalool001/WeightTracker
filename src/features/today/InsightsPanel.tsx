import { useId, useState } from 'react';
import { useT } from '@/i18n';
import { useInsights } from '@/store/selectors';
import { cn } from '@/lib/cn';

const VISIBLE = 6;

/**
 * Analysis that the KPI strip does not already say: patterns, records,
 * paces. Plain sentences on rules, no icons.
 */
export function InsightsPanel({ className }: { className?: string }) {
  const t = useT();
  const id = useId();
  const insights = useInsights();
  const [expanded, setExpanded] = useState(false);
  // Hiding a single row behind a button saves nothing.
  const cap = insights.length > VISIBLE + 1 ? VISIBLE : insights.length;
  const shown = expanded ? insights : insights.slice(0, cap);

  return (
    <section aria-labelledby={id} className={cn('panel flex min-w-0 flex-col p-4 sm:p-5', className)}>
      <h2 id={id} className="mb-2 flex min-h-9 items-center text-[15px] font-semibold text-text lg:text-sm">
        {t.insightsTitle}
      </h2>
      {insights.length === 0 ? (
        <p className="text-[15px] text-muted">{t.insightsEmpty}</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((i) => (
            <li key={i.id} className="border-t border-rule py-3 text-[15px] leading-snug text-text first:border-t-0 first:pt-1 lg:text-sm">
              {i.text}
            </li>
          ))}
        </ul>
      )}
      {insights.length > cap && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-auto h-11 self-start rounded-full px-1 text-sm font-medium text-text underline-offset-4 hover:underline lg:h-9"
        >
          {expanded ? t.showLess : t.showMore(insights.length - cap)}
        </button>
      )}
    </section>
  );
}
