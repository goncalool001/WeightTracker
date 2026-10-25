import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

/** Concrete colours ECharts needs, resolved from the active CSS theme. */
export interface ChartTokens {
  ink: string;
  muted: string;
  dot: string;
  accent: string;
  accentSoft: string;
  positive: string;
  negative: string;
  grid: string;
  ground: string;
  /** The inner card behind the chart. */
  raised: string;
  border: string;
  font: string;
}

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

function readTokens(): ChartTokens {
  return {
    ink: readVar('--chart-ink'),
    muted: readVar('--muted'),
    dot: readVar('--chart-dot'),
    accent: readVar('--accent'),
    accentSoft: readVar('--accent-soft'),
    positive: readVar('--positive'),
    negative: readVar('--negative'),
    grid: readVar('--chart-grid'),
    ground: readVar('--ground'),
    raised: readVar('--raised'),
    border: readVar('--border'),
    font: '"Instrument Sans", Inter, system-ui, sans-serif',
  };
}

/** Resolve chart colours from CSS variables, recomputing on theme change. */
export function useChartTokens(): ChartTokens {
  const theme = useStore((s) => s.theme);
  const [tokens, setTokens] = useState<ChartTokens>(() => readTokens());
  useEffect(() => {
    setTokens(readTokens());
  }, [theme]);
  return tokens;
}

/** Shared tooltip chrome: a plain box with a hairline, no arrow. */
export function tooltipBase(tok: ChartTokens) {
  return {
    backgroundColor: tok.ground,
    borderColor: tok.border,
    borderWidth: 1,
    padding: [8, 12] as [number, number],
    textStyle: { color: tok.ink, fontSize: 13, fontFamily: tok.font },
    extraCssText: 'border-radius:10px;',
    confine: true,
  };
}
