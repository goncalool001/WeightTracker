import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsInstance } from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { RotateCcw } from 'lucide-react';

interface BaseChartProps {
  option: EChartsOption;
  /** Label for the floating reset-zoom button (shown only when zoomed). */
  resetLabel?: string;
}

/**
 * Thin wrapper around `echarts-for-react` that:
 *  1. Keeps the canvas sized to its container. `echarts-for-react` only calls
 *     `resize()` on *window* resize — not when the container itself changes
 *     size (initial layout settling, the LoadingState→Dashboard swap, a flex
 *     reflow, or Vite HMR). A `ResizeObserver` makes the chart track its real
 *     box, preventing the content from collapsing into a thin band.
 *  2. Surfaces a "Reset zoom" affordance. Zoom/pan is driven by the chart's
 *     `inside` dataZoom (wheel, pinch, drag) with no visible slider; this
 *     button appears only once the user has zoomed in, and restores the full
 *     range on click.
 */
export function BaseChart({ option, resetLabel = 'Reset zoom' }: BaseChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => chartRef.current?.resize());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A `notMerge` option swap (range/granularity/theme change) resets the zoom
  // window to full, so clear the button state to match.
  useEffect(() => {
    setZoomed(false);
  }, [option]);

  const handleReady = (instance: EChartsInstance) => {
    chartRef.current = instance;
    instance.resize();
    instance.on('datazoom', () => {
      const opt = instance.getOption() as any;
      const dz = opt?.dataZoom?.[0] ?? {};
      const start = dz.start ?? 0;
      const end = dz.end ?? 100;
      setZoomed(start > 0.5 || end < 99.5);
    });
  };

  const resetZoom = () => {
    chartRef.current?.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
    setZoomed(false);
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <ReactECharts
        option={option}
        notMerge
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onChartReady={handleReady}
      />
      {zoomed && (
        <button
          type="button"
          onClick={resetZoom}
          title={resetLabel}
          aria-label={resetLabel}
          className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-md
                     border border-border bg-surface/90 px-2 py-1 text-xs font-semibold
                     text-muted shadow-sm backdrop-blur transition-colors hover:text-text"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{resetLabel}</span>
        </button>
      )}
    </div>
  );
}
