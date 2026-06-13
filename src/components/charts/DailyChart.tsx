import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { format } from 'date-fns';
import { dayOffsets, linearFit, movingAverage, predict } from '@/domain';
import { MAX_POINT_LABELS, MA_WINDOW } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { Overlay, WeightEntry } from '@/types';
import { useChartTokens } from './chartTokens';
import { paddedYRange } from './paddedRange';
import { EmptyChart } from './EmptyChart';

interface DailyChartProps {
  entries: WeightEntry[];
  goalWeight: number | null;
  overlay: Overlay;
}

/** `rgb(r,g,b)` → `rgba(r,g,b,a)`. */
const rgba = (c: string, a: number) =>
  c.replace('rgb(', 'rgba(').replace(')', `,${a})`);

/** Interactive daily-weight line chart: gradient area, theme-aware value
 *  chips, a rich tooltip, a high-contrast trend/MA overlay and a goal line. */
export function DailyChart({ entries, goalWeight, overlay }: DailyChartProps) {
  const t = useChartTokens();

  const option = useMemo<EChartsOption>(() => {
    const weights = entries.map((e) => e.weight);
    const { min, max } = paddedYRange(weights, goalWeight);
    const showLabels = entries.length <= MAX_POINT_LABELS;

    const chipLabel = {
      color: t.labelText,
      backgroundColor: t.labelBg,
      borderColor: t.labelBorder,
      borderWidth: 1,
      padding: [3, 5] as [number, number],
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600 as const,
    };

    const series: SeriesOption[] = [
      {
        id: 'daily',
        name: 'Daily',
        type: 'line',
        smooth: 0.35,
        showSymbol: showLabels,
        symbolSize: 7,
        data: entries.map((e) => [e.date, e.weight]),
        itemStyle: { color: t.line, borderColor: t.plotBg, borderWidth: 1.5 },
        lineStyle: { color: t.line, width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: rgba(t.line, 0.28) },
              { offset: 1, color: rgba(t.line, 0.02) },
            ],
          },
        },
        emphasis: { focus: 'series', scale: 1.5 },
        label: {
          show: showLabels,
          position: 'top',
          distance: 8,
          formatter: (p: any) => Number(p.value[1]).toFixed(1),
          ...chipLabel,
        },
        markLine:
          goalWeight != null
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: { color: t.goal, type: 'dashed', width: 2 },
                label: {
                  formatter: `Goal ${goalWeight.toFixed(1)} kg`,
                  position: 'insideEndTop',
                  color: t.goal,
                  backgroundColor: t.labelBg,
                  borderColor: t.labelBorder,
                  borderWidth: 1,
                  padding: [3, 6],
                  borderRadius: 4,
                  fontWeight: 700,
                },
                data: [{ yAxis: goalWeight }],
              }
            : undefined,
        z: 3,
      },
    ];

    // Overlay: trend line OR moving average (mutually exclusive).
    if (overlay === 'ma' && entries.length >= 3) {
      const ma = movingAverage(weights, MA_WINDOW);
      series.push({
        name: `${MA_WINDOW}-day avg`,
        type: 'line',
        smooth: 0.4,
        showSymbol: false,
        data: entries.map((e, i) => [e.date, Number(ma[i].toFixed(2))]),
        lineStyle: { color: t.ma, width: 3 },
        itemStyle: { color: t.ma },
        emphasis: { focus: 'series' },
        z: 2,
      });
    } else if (overlay === 'trend' && entries.length >= 2) {
      const xs = dayOffsets(entries.map((e) => e.date));
      const trend = predict(linearFit(xs, weights), xs);
      series.push({
        name: 'Trend',
        type: 'line',
        showSymbol: false,
        data: entries.map((e, i) => [e.date, Number(trend[i].toFixed(2))]),
        lineStyle: { color: t.trend, width: 3, type: 'dashed' },
        itemStyle: { color: t.trend },
        emphasis: { focus: 'series' },
        z: 2,
      });
    }

    return {
      backgroundColor: 'transparent',
      grid: { left: 6, right: 18, top: 46, bottom: 28, containLabel: true },
      legend: {
        top: 6,
        right: 6,
        textStyle: { color: t.axis, fontSize: 12 },
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: t.tooltipBg,
        borderColor: t.labelBorder,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: t.tooltipText, fontSize: 12 },
        extraCssText:
          'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);',
        axisPointer: {
          type: 'line',
          lineStyle: { color: t.axis, width: 1, type: 'dashed' },
        },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const date = items[0].data[0] as string;
          const header = formatDate(date);
          const row = (a: string, b: string, color?: string) =>
            `<div style="display:flex;justify-content:space-between;gap:18px;line-height:1.7">` +
            `<span>${a}</span><span style="font-weight:700${
              color ? `;color:${color}` : ''
            }">${b}</span></div>`;

          // Weight + delta vs the previous measurement for the daily series.
          const idx = entries.findIndex((e) => e.date === date);
          const weight = entries[idx]?.weight ?? Number(items[0].data[1]);
          let body = row('Weight', `${weight.toFixed(1)} kg`);
          if (idx > 0) {
            const delta = weight - entries[idx - 1].weight;
            const color =
              delta < -0.001 ? t.good : delta > 0.001 ? t.bad : t.tooltipText;
            body += row(
              'Delta',
              `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`,
              color,
            );
          }

          // Any overlay series (trend / moving average).
          const overlays = items
            .filter((p: any) => p.seriesName !== 'Daily')
            .map((p: any) =>
              row(
                `${p.marker}${p.seriesName}`,
                `${Number(p.data[1]).toFixed(1)} kg`,
              ),
            )
            .join('');

          return `<div style="font-weight:700;margin-bottom:4px">${header}</div>${body}${overlays}`;
        },
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: t.grid } },
        axisTick: { show: false },
        axisLabel: {
          color: t.axis,
          fontSize: 12,
          hideOverlap: true,
          formatter: (val: any) => format(new Date(val), 'dd MMM'),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: Number(min.toFixed(1)),
        max: Number(max.toFixed(1)),
        axisLabel: { color: t.axis, fontSize: 12, formatter: '{value} kg' },
        splitLine: { lineStyle: { color: t.grid, type: 'dashed' } },
      },
      series,
    };
  }, [entries, goalWeight, overlay, t]);

  if (entries.length === 0) {
    return (
      <EmptyChart message="No data in this range — add an entry to begin." />
    );
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
