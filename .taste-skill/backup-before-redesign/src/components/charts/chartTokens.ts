import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

/** Concrete colours ECharts needs, resolved from the active CSS theme. */
export interface ChartTokens {
  line: string;
  trend: string;
  ma: string;
  goal: string;
  good: string;
  bad: string;
  plotBg: string;
  grid: string;
  axis: string;
  title: string;
  tooltipBg: string;
  tooltipText: string;
  /** Opaque chip behind in-chart value/annotation labels. */
  labelBg: string;
  labelText: string;
  labelBorder: string;
}

/** Read a `--c-*`/token CSS variable (space-separated RGB) as `rgb(...)`. */
function readVar(name: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw ? `rgb(${raw.split(/\s+/).join(',')})` : '#000';
}

function readTokens(): ChartTokens {
  return {
    line: readVar('--c-line'),
    trend: readVar('--c-trend'),
    ma: readVar('--c-ma'),
    goal: readVar('--c-goal'),
    good: readVar('--good'),
    bad: readVar('--bad'),
    plotBg: readVar('--c-plot-bg'),
    grid: readVar('--c-grid'),
    axis: readVar('--c-axis'),
    title: readVar('--text'),
    tooltipBg: readVar('--surface'),
    tooltipText: readVar('--text'),
    labelBg: readVar('--c-label-bg'),
    labelText: readVar('--c-label-text'),
    labelBorder: readVar('--c-label-border'),
  };
}

/**
 * Resolve chart colours from CSS variables, recomputing whenever the theme
 * changes. (The CSS transition has settled by the time React re-renders, and
 * ECharts reads the final values either way.)
 */
export function useChartTokens(): ChartTokens {
  const theme = useStore((s) => s.theme);
  const [tokens, setTokens] = useState<ChartTokens>(() => readTokens());

  useEffect(() => {
    setTokens(readTokens());
  }, [theme]);

  return tokens;
}
