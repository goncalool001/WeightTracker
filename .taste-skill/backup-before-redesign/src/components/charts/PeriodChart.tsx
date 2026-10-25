import { useMemo } from 'react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { linearFit, predict } from '@/domain';
import type { T } from '@/i18n';
import type { Granularity, GoalProjection, PeriodAverage } from '@/types';
import { useChartTokens } from './chartTokens';
import { niceYAxis } from './paddedRange';
import { EmptyChart } from './EmptyChart';
import { BaseChart } from './BaseChart';

interface PeriodChartProps {
  periods: PeriodAverage[];
  goalWeight: number | null;
  projection: GoalProjection | null;
  granularity: Granularity;
  showLabels: boolean;
  t: T;
}

/** `rgb(r,g,b)` → `rgba(r,g,b,a)`. */
const rgba = (c: string, a: number) =>
  c.replace('rgb(', 'rgba(').replace(')', `,${a})`);

/** Period-average bar chart (weekly or monthly): avg + coloured delta labels,
 *  goal-aware bars, a clear trend line behind bars, and a rich tooltip. */
export function PeriodChart({
  periods,
  goalWeight,
  projection,
  granularity,
  showLabels,
  t,
}: PeriodChartProps) {
  const tok = useChartTokens();

  const option = useMemo<EChartsOption>(() => {
    const labels = periods.map((p) => p.label);
    const avgs = periods.map((p) => p.average);
    const { min, max, interval } = niceYAxis(avgs, goalWeight, 2.2);

    const barData = periods.map((p) => {
      const underGoal = goalWeight != null && p.average <= goalWeight;
      const base = underGoal ? tok.goal : tok.line;
      return {
        value: p.average,
        itemStyle: {
          borderRadius: [6, 6, 0, 0] as [number, number, number, number],
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: rgba(base, 0.95) },
              { offset: 1, color: rgba(base, 0.55) },
            ],
          },
        },
      };
    });

    const seriesLabel = granularity === 'monthly' ? t.monthlyAvg : t.weeklyAvg;

    const series: SeriesOption[] = [];

    // Trend line first (z=1) so it renders BEHIND bars and their labels.
    if (periods.length >= 2) {
      const xs = periods.map((_, i) => i);
      const trend = predict(linearFit(xs, avgs), xs);
      series.push({
        name: t.overlayTrend,
        type: 'line',
        smooth: false,
        showSymbol: false,
        data: trend.map((y) => Number(y.toFixed(2))),
        lineStyle: { color: tok.trend, width: 2.5, type: 'dashed' },
        itemStyle: { color: tok.trend },
        emphasis: { focus: 'series' },
        z: 1,
      });
    }

    // Bars on top (z=3) so labels are always readable over the trend line.
    series.push({
      name: seriesLabel,
      type: 'bar',
      data: barData,
      barMaxWidth: 56,
      barCategoryGap: '38%',
      label: {
        show: showLabels,
        position: 'top',
        distance: 6,
        color: tok.labelText,
        backgroundColor: tok.labelBg,
        borderColor: tok.labelBorder,
        borderWidth: 1,
        padding: [3, 6],
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        rich: {
          down: { color: tok.good, fontWeight: 700 },
          up: { color: tok.bad, fontWeight: 700 },
          flat: { color: tok.axis, fontWeight: 600 },
        },
        formatter: (p: any) => {
          const i = p.dataIndex as number;
          const avg = periods[i].average.toFixed(1);
          if (i === 0) return `${avg} kg`;
          const d = periods[i].average - periods[i - 1].average;
          const tag = d > 0.01 ? 'up' : d < -0.01 ? 'down' : 'flat';
          const sign = d > 0 ? '+' : '';
          return `${avg} kg {${tag}|(${sign}${d.toFixed(1)})}`;
        },
      },
      markLine:
        goalWeight != null
          ? {
              silent: true,
              symbol: 'none',
              lineStyle: { color: tok.goal, type: 'dashed', width: 2 },
              label: {
                formatter:
                  `Goal ${goalWeight.toFixed(1)} kg` +
                  (projection ? `  ·  ~${t.fmtDate(projection.date)}` : ''),
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
    });

    return {
      backgroundColor: 'transparent',
      grid: { left: 6, right: 18, top: 46, bottom: 70, containLabel: true },
      legend: {
        top: 6,
        right: 6,
        textStyle: { color: tok.axis, fontSize: 12 },
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8,
        show: periods.length >= 2,
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
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const barItem = items.find((p: any) => p.componentSubType === 'bar') ?? items[0];
          const idx = barItem.dataIndex as number;
          const p = periods[idx];
          const prev = idx > 0 ? periods[idx - 1] : null;
          const delta = prev ? p.average - prev.average : null;
          const row = (a: string, b: string, color?: string) =>
            `<div style="display:flex;justify-content:space-between;gap:18px;line-height:1.7">` +
            `<span>${a}</span><span style="font-weight:700${
              color ? `;color:${color}` : ''
            }">${b}</span></div>`;
          const numLabel = granularity === 'monthly' ? t.monthNum(p.number) : t.weekNum(p.number);
          const deltaRow =
            delta == null
              ? ''
              : row(
                  t.deltaLbl,
                  `${delta > 0 ? '+' : ''}${delta.toFixed(2)} kg`,
                  delta > 0.01 ? tok.bad : delta < -0.01 ? tok.good : tok.tooltipText,
                );
          return (
            `<div style="font-weight:700;margin-bottom:2px">${numLabel}</div>` +
            `<div style="color:${tok.axis};margin-bottom:4px">${t.fmtDate(p.start)} – ${t.fmtDate(p.end)}</div>` +
            row(t.averageLbl, `${p.average.toFixed(2)} kg`) +
            deltaRow +
            row(t.entriesLbl, String(p.measurements))
          );
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: tok.grid } },
        axisTick: { show: false },
        axisLabel: {
          color: tok.axis,
          fontSize: 11,
          rotate: labels.length > 8 ? 30 : 0,
          hideOverlap: true,
        },
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
  }, [periods, goalWeight, projection, granularity, showLabels, tok, t]);

  if (periods.length === 0) {
    return (
      <EmptyChart
        message={
          granularity === 'monthly' ? t.noMonthlyData : t.noWeeklyData
        }
      />
    );
  }

  return <BaseChart option={option} resetLabel={t.resetZoom} />;
}
