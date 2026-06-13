import type { LucideIcon } from 'lucide-react';
import {
  Award,
  CalendarCheck,
  Gauge,
  ListChecks,
  PieChart,
  Scale,
  Target,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Insight, InsightIcon, InsightTone } from '@/types';

const ICONS: Record<InsightIcon, LucideIcon> = {
  goalPace: CalendarCheck,
  progress: Target,
  window: TrendingDown,
  accel: Gauge,
  consistency: ListChecks,
  best: Award,
  contribution: PieChart,
  compare: Scale,
};

const TONE_ICON: Record<InsightTone, string> = {
  good: 'bg-good/15 text-good',
  bad: 'bg-bad/15 text-bad',
  neutral: 'bg-surface-2 text-muted',
  accent: 'bg-accent/15 text-accent',
};

/** A single analytical observation: icon chip + sentence (+ optional bar). */
export function InsightRow({ insight }: { insight: Insight }) {
  const Icon = ICONS[insight.icon];
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          TONE_ICON[insight.tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-text">{insight.text}</p>
        {insight.progress != null && (
          <div
            className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={Math.round(insight.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${insight.progress}%` }}
            />
          </div>
        )}
      </div>
    </li>
  );
}
