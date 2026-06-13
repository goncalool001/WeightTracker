import { useMemo } from 'react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { format } from 'date-fns';
import { dayOffsets, linearFit, movingAverage, predict } from '@/domain';
import { MAX_POINT_LABELS, MA_WINDOW } from '@/lib/constants';
import type { T } from '@/i18n';
import type { Overlay, WeightEntry } from '@/types';
import { useChartTokens } from './chartTokens';
import { niceYAxis } from './paddedRange';
import { EmptyChart } from './EmptyChart';
import { BaseChart } from './BaseChart';

interface DailyChartProps {
  entries: WeightEntry[];
  goalWeight: number | null;
  overlay: Overlay;
  showLabels: boolean;
  t: T;
}

/** `rgb(r,g,b)` → `rgba(r,g,b,a)`. */
const rgba = (c: string, a: number) =>
  c.replace('rgb(', 'rgba(').replace(')', `,${a})`);

/** Interactive daily-weight line chart: gradient area, theme-aware value
 *  chips, a rich tooltip, a high-contrast trend/MA overlay and a goal line. */
export function DailyChart({ entries, goalWeight, overlay, showLabels, t }: DailyChartProps) {
  const tok = useChartTokens();

  const option = useMemo<EChartsOption>(() => {
    const weights = entries.map((e) => e.weight);
    const { min, max, interval } = niceYAxis(weights, goalWeight);
    const canShowLabels = showLabels && entries.length <= MAX_POINT_LABELS;

    const chipLabel = {
      color: tok.labelText,
      backgroundColor: tok.labelBg,
      borderColor: tok.labelBorder,
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
        showSymbol: canShowLabels,
        symbolSize: 7,
        data: entries.map((e) => [e.date, e.weight]),
        itemStyle: { color: tok.line, borderColor: tok.plotBg, borderWidth: 1.5 },
        lineStyle: { color: tok.line, width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: rgba(tok.line, 0.28) },
              { offset: 1, color: rgba(tok.line, 0.02) },
            ],
          },
        },
        emphasis: { focus: 'series', scale: 1.5 },
        label: {
          show: canShowLabels,
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
                lineStyle: { color: tok.goal, type: 'dashed', width: 2 },
                label: {
                  formatter: `Goal ${goalWeight.toFixed(1)} kg`,
                  position: 'insideEndTop',
                  color: tok.goal,
                  backgroundColor: tok.labelBg,
                  borderColor: tok.labelBorder,
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

    if (overlay === 'ma' && entries.length >= 3) {
      const ma = movingAverage(weights, MA_WINDOW);
      series.push({
        name: t.overlayMa,
        type: 'line',
        smooth: 0.4,
        showSymbol: false,
        data: entries.map((e, i) => [e.date, Number(ma[i].toFixed(2))]),
        lineStyle: { color: tok.ma, width: 3 },
        itemStyle: { color: tok.ma },
        emphasis: { focus: 'series' },
        z: 2,
      });
    } else if (overlay === 'trend' && entries.length >= 2) {
      const xs = dayOffsets(entries.map((e) => e.date));
      const trend = predict(linearFit(xs, weights), xs);
      series.push({
        name: t.overlayTrend,
        type: 'line',
        showSymbol: false,
        data: entries.map((e, i) => [e.date, Number(trend[i].toFixed(2))]),
        lineStyle: { color: tok.trend, width: 3, type: 'dashed' },
        itemStyle: { color: tok.trend },
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
        textStyle: { color: tok.axis, fontSize: 12 },
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tok.tooltipBg,
        borderColor: tok.labelBorder,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: tok.tooltipText, fontSize: 12 },
        extraCssText:
          'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);',
        axisPointer: {
          type: 'line',
          lineStyle: { color: tok.axis, width: 1, type: 'dashed' },
        },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const date = items[0].data[0] as string;
          const header = t.fmtDate(date);
          const row = (a: string, b: string, color?: string) =>
            `<div style="display:flex;justify-content:space-between;gap:18px;line-height:1.7">` +
            `<span>${a}</span><span style="font-weight:700${
              color ? `;color:${color}` : ''
            }">${b}</span></div>`;

          const idx = entries.findIndex((e) => e.date === date);
          const weight = entries[idx]?.weight ?? Number(items[0].data[1]);
          let body = row(t.weightLbl, `${weight.toFixed(1)} kg`);
          if (idx > 0) {
            const delta = weight - entries[idx - 1].weight;
            const color =
              delta < -0.001 ? tok.good : delta > 0.001 ? tok.bad : tok.tooltipText;
            body += row(
              t.deltaLbl,
              `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`,
              color,
            );
          }

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
        axisLine: { lineStyle: { color: tok.grid } },
        axisTick: { show: false },
        axisLabel: {
          color: tok.axis,
          fontSize: 12,
          hideOverlap: true,
          formatter: (val: any) => format(new Date(val), 'dd MMM'),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min,
        max,
        interval,
        axisLabel: {
          color: tok.axis,
          fontSize: 12,
          formatter: '{value} kg',
          showMinLabel: false,
          showMaxLabel: false,
        },
        splitLine: { lineStyle: { color: tok.grid, type: 'dashed' } },
      },
      // Sliderless zoom/pan: wheel + pinch to zoom, drag to pan. The reset
      // affordance lives in BaseChart.
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomOnMouseWheel: true,
          moveOnMouseWheel: false,
          moveOnMouseMove: true,
          filterMode: 'filter',
        },
      ],
      series,
    };
  }, [entries, goalWeight, overlay, showLabels, tok, t]);

  if (entries.length === 0) {
    return <EmptyChart message={t.noChartData} />;
  }

  return <BaseChart option={option} resetLabel={t.resetZoom} />;
}
