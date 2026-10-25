import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsInstance } from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { RotateCcw } from 'lucide-react';

interface BaseChartProps {
  option: EChartsOption;
  /** Label for the reset-zoom button (shown only when zoomed). */
  resetLabel?: string;
  /** Plain-language summary read by screen readers instead of the canvas. */
  ariaLabel: string;
}

/**
 * Thin wrapper around `echarts-for-react` that:
 *  1. Keeps the canvas sized to its container with a ResizeObserver
 *     (`echarts-for-react` only listens to window resizes).
 *  2. Shows a "Reset zoom" button once the user has zoomed (desktop only;
 *     touch screens read the chart on drag instead of zooming).
 *  3. Exposes the chart to assistive tech as one image with a summary.
 */
export function BaseChart({ option, resetLabel = 'Reset zoom', ariaLabel }: BaseChartProps) {
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

  // A `notMerge` option swap resets the zoom window, so clear the button.
  useEffect(() => {
    setZoomed(false);
  }, [option]);

  const handleReady = (instance: EChartsInstance) => {
    chartRef.current = instance;
    instance.resize();
    instance.on('datazoom', () => {
      const dz = (instance.getOption() as { dataZoom?: Array<{ start?: number; end?: number }> })
        ?.dataZoom?.[0];
      setZoomed((dz?.start ?? 0) > 0.5 || (dz?.end ?? 100) < 99.5);
    });
  };

  const resetZoom = () => {
    chartRef.current?.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
    setZoomed(false);
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <div role="img" aria-label={ariaLabel} className="h-full w-full">
        <ReactECharts
          option={option}
          notMerge
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          onChartReady={handleReady}
        />
      </div>
      {zoomed && (
        <button
          type="button"
          onClick={resetZoom}
          className="absolute right-2 top-2 z-10 flex h-9 items-center gap-1.5 rounded-full border border-control
                     bg-raised px-3 text-[13px] font-medium text-text hover:bg-active"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {resetLabel}
        </button>
      )}
    </div>
  );
}
