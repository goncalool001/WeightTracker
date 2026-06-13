import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { linearFit, predict } from '@/domain';
import { formatDate } from '@/lib/format';
import type { Granularity, GoalProjection, PeriodAverage } from '@/types';
import { useChartTokens } from './chartTokens';
import { paddedYRange } from './paddedRange';
import { EmptyChart } from './EmptyChart';

interface PeriodChartProps {
  periods: PeriodAverage[];
  goalWeight: number | null;
  projection: GoalProjection | null;
  granularity: Granularity;
}

/** `rgb(r,g,b)` → `rgba(r,g,b,a)`. */
const rgba = (c: string, a: number) =>
  c.replace('rgb(', 'rgba(').replace(')', `,${a})`);

/** Period-average bar chart (weekly or monthly): avg + coloured delta labels,
 *  goal-aware bars, a clear trend line, and a rich tooltip. */
export function PeriodChart({
  periods,
  goalWeight,
  projection,
  granularity,
}: PeriodChartProps) {
  const t = useChartTokens();
  const unit = granularity === 'monthly' ? 'Month' : 'Week';

  const option = useMemo<EChartsOption>(() => {
    const labels = periods.map((p) => p.label);
    const avgs = periods.map((p) => p.average);
    const { min, max } = paddedYRange(avgs, goalWeight, 2.2);

    const barData = periods.map((p) => {
      const underGoal = goalWeight != null && p.average <= goalWeight;
      const base = underGoal ? t.goal : t.line;
      return {
        value: p.average,
        itemStyle: {
          borderRadius: [6, 6, 0, 0] as [number, number, number, number],
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: rgba(base, 0.95) },
              { offset: 1, color: rgba(base, 0.55) },
            ],
          },
        },
      };
    });

    const series: SeriesOption[] = [
      {
        name: `${unit}ly avg`,
        type: 'bar',
        data: barData,
        barMaxWidth: 56,
        barCategoryGap: '38%',
        label: {
          show: true,
          position: 'top',
          distance: 6,
          color: t.labelText,
          backgroundColor: t.labelBg,
          borderColor: t.labelBorder,
          borderWidth: 1,
          padding: [3, 6],
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          rich: {
            down: { color: t.good, fontWeight: 700 },
            up: { color: t.bad, fontWeight: 700 },
            flat: { color: t.axis, fontWeight: 600 },
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
                lineStyle: { color: t.goal, type: 'dashed', width: 2 },
                label: {
                  formatter:
                    `Goal ${goalWeight.toFixed(1)} kg` +
                    (projection ? `  ·  ~${formatDate(projection.date)}` : ''),
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
        z: 2,
      },
    ];

    if (periods.length >= 2) {
      const xs = periods.map((_, i) => i);
      const trend = predict(linearFit(xs, avgs), xs);
      series.push({
        name: 'Trend',
        type: 'line',
        smooth: false,
        showSymbol: false,
        data: trend.map((y) => Number(y.toFixed(2))),
        lineStyle: { color: t.trend, width: 3, type: 'dashed' },
        itemStyle: { color: t.trend },
        emphasis: { focus: 'series' },
        z: 3,
      });
    }

    return {
      backgroundColor: 'transparent',
      grid: { left: 6, right: 18, top: 46, bottom: 70, containLabel: true },
      legend: {
        top: 6,
        right: 6,
        textStyle: { color: t.axis, fontSize: 12 },
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8,
        show: periods.length >= 2,
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
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          const idx = items[0].dataIndex as number;
          const p = periods[idx];
          const prev = idx > 0 ? periods[idx - 1] : null;
          const delta = prev ? p.average - prev.average : null;
          const row = (a: string, b: string, color?: string) =>
            `<div style="display:flex;justify-content:space-between;gap:18px;line-height:1.7">` +
            `<span>${a}</span><span style="font-weight:700${
              color ? `;color:${color}` : ''
            }">${b}</span></div>`;
          const deltaRow =
            delta == null
              ? ''
              : row(
                  `Delta`,
                  `${delta > 0 ? '+' : ''}${delta.toFixed(2)} kg`,
                  delta > 0.01 ? t.bad : delta < -0.01 ? t.good : t.tooltipText,
                );
          return (
            `<div style="font-weight:700;margin-bottom:2px">${unit} #${p.number}</div>` +
            `<div style="color:${t.axis};margin-bottom:4px">${formatDate(p.start)} – ${formatDate(p.end)}</div>` +
            row('Average', `${p.average.toFixed(2)} kg`) +
            deltaRow +
            row('Entries', String(p.measurements))
          );
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: t.grid } },
        axisTick: { show: false },
        axisLabel: {
          color: t.axis,
          fontSize: 11,
          rotate: labels.length > 8 ? 30 : 0,
          hideOverlap: true,
        },
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
  }, [periods, goalWeight, projection, unit, t]);

  if (periods.length === 0) {
    return <EmptyChart message={`No ${unit.toLowerCase()}ly data in this range.`} />;
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
