import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'good' | 'bad' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  icon?: ReactNode;
}

const toneClass: Record<Tone, string> = {
  good: 'text-good',
  bad: 'text-bad',
  neutral: 'text-muted',
};

/** Compact KPI card: label, large value, and an optional toned sub-line. */
export function MetricCard({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
}: MetricCardProps) {
  return (
    <div className="card themed flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <span className="text-2xl font-bold leading-tight text-text">
        {value}
      </span>
      {sub && (
        <span className={cn('text-xs font-semibold', toneClass[tone])}>
          {sub}
        </span>
      )}
    </div>
  );
}
