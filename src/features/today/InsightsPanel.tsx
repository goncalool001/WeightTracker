import { useId, useState } from 'react';
import { useT } from '@/i18n';
import { useInsights } from '@/store/selectors';
import { cn } from '@/lib/cn';
import type { InsightTone } from '@/types';

/** Values in a sentence: decimals, and whole numbers with a unit. */
const VALUE = /([+\-−]?\d+\.\d+(?:\s?kg(?:\/(?:wk|sem))?)?|\d+\s?(?:kg|%))/;

/**
 * The sentence with its values set in full ink and weight. The first value
 * carries the insight's colour when it says something about the goal: green
 * towards it, red away from it.
 */
function Sentence({ text, tone }: { text: string; tone: InsightTone }) {
  let first = true;
  return (
    <>
      {text.split(VALUE).map((part, i) => {
        if (i % 2 === 0) return part;
        const colour = first && (tone === 'good' || tone === 'bad');
        first = false;
        return (
          <span
            key={i}
            className={cn(
              'num whitespace-nowrap font-semibold',
              colour ? (tone === 'good' ? 'text-positive' : 'text-negative') : 'text-text',
            )}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}

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
            <li key={i.id} className="border-t border-rule py-3 text-[15px] leading-snug text-muted first:border-t-0 first:pt-1 lg:text-sm">
              <Sentence text={i.text} tone={i.tone} />
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
