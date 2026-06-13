import { Sparkles } from 'lucide-react';
import { useInsights } from '@/store/selectors';
import { InsightRow } from './InsightRow';

/**
 * "Insights" section — an analytical feed of generated observations. Rendered
 * as a divided vertical list so the layout adapts naturally to however many
 * insights are produced (no fixed grid, no unbalanced rows).
 */
export function InsightsPanel() {
  const insights = useInsights();

  return (
    <section className="card themed overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold text-text">Insights</h2>
        <span className="text-xs text-muted">patterns found in your data</span>
      </header>

      {insights.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">
          Keep logging — insights appear once there's enough history to spot
          trends.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {insights.map((insight) => (
            <InsightRow key={insight.id} insight={insight} />
          ))}
        </ul>
      )}
    </section>
  );
}
