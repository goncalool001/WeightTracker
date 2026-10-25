import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { roundWeight } from '@/domain';
import { kg, signed } from '@/lib/format';
import type { T } from '@/i18n';
import type { Granularity, PeriodAverage } from '@/types';
import { tooltipBase, useChartTokens } from './chartTokens';
import { signedAxis } from './paddedRange';
import { BaseChart } from './BaseChart';

interface PeriodChartProps {
  /** Periods in range, plus the one before it (needed for the first change). */
  periods: PeriodAverage[];
  /** Index in `periods` of the first period to draw. */
  from: number;
  granularity: Granularity;
  /** The direction that counts as progress (green). */
  good: 'down' | 'up';
  coarse: boolean;
  narrow: boolean;
  t: T;
}

/**
 * How much the average moved from one week (or month) to the next. Columns
 * hang from one zero line: below it is weight lost, above it gained. Green
 * is a move towards the goal (down, unless the goal is to gain), red away
 * from it, a change inside ±0.05 kg grey. Changes are taken between the
 * averages as displayed (0.1 kg), so the tooltip and the table agree.
 */
export function PeriodChart({ periods, from, granularity, good, coarse, narrow, t }: PeriodChartProps) {
  const tok = useChartTokens();
  /** Green towards the goal, red away from it, grey inside ±0.05 kg. */
  const colourOf = (d: number) =>
    Math.abs(d) <= 0.05 ? null : (good === 'up' ? d > 0 : d < 0) ? 'pos' : 'neg';

  const rows = useMemo(
    () =>
      periods.slice(Math.max(from, 1)).map((p, i) => {
        const prev = periods[Math.max(from, 1) + i - 1];
        return { p, delta: roundWeight(roundWeight(p.average) - roundWeight(prev.average)) };
      }),
    [periods, from],
  );

  const option = useMemo<EChartsOption>(() => {
    const { min, max, interval } = signedAxis(rows.map((r) => r.delta));
    const label = (p: PeriodAverage) =>
      granularity === 'monthly' ? t.fmtShort(p.start).replace(/^\d+\s/, '') : t.fmtShort(p.start);

    return {
      backgroundColor: 'transparent',
      animationDuration: 300,
      textStyle: { fontFamily: tok.font },
      grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipBase(tok),
        trigger: 'axis',
        triggerOn: 'mousemove|click',
        // The flat hover band (ECharts names it after shadows): a grey tint shown on hover only. taste-skill-ignore
        axisPointer: { type: 'shadow', shadowStyle: { color: tok.grid, opacity: 0.6 } }, // taste-skill-ignore
        formatter: (params: unknown) => {
          const i = (Array.isArray(params) ? params[0] : params)?.dataIndex as number;
          const { p, delta } = rows[i];
          const c = colourOf(delta);
          const color = c === 'pos' ? tok.positive : c === 'neg' ? tok.negative : tok.muted;
          const arrow = delta < -0.05 ? '▼ ' : delta > 0.05 ? '▲ ' : '';
          const row = (a: string, b: string, c?: string) =>
            `<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.7">` +
            `<span style="color:${tok.muted}">${a}</span>` +
            `<span style="font-variant-numeric:tabular-nums;${c ? `color:${c}` : ''}">${b}</span></div>`;
          const title = granularity === 'monthly' ? t.monthNum(p.number) : t.weekNum(p.number);
          return (
            `<div style="font-weight:500">${title}</div>` +
            `<div style="color:${tok.muted};margin-bottom:2px">${t.fmtShort(p.start)} – ${t.fmtShort(p.end)}</div>` +
            row(t.avgLbl, `${kg(p.average)} kg`) +
            row(t.chartChange, `${arrow}${signed(delta)} kg`, color) +
            row(t.weighInsLbl, String(p.measurements))
          );
        },
      },
      xAxis: {
        type: 'category',
        data: rows.map((r) => label(r.p)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tok.muted, fontSize: 12, hideOverlap: true, interval: 'auto' },
      },
      yAxis: {
        type: 'value',
        min,
        max,
        interval,
        axisLabel: { color: tok.muted, fontSize: 12, formatter: (v: number) => signed(v) },
        splitLine: { lineStyle: { color: tok.grid, width: 1 } },
      },
      dataZoom: coarse || rows.length < 16 ? [] : [{ type: 'inside', zoomOnMouseWheel: 'ctrl', moveOnMouseWheel: false, moveOnMouseMove: true }],
      series: [
        {
          type: 'bar',
          barMaxWidth: narrow ? 14 : 22,
          data: rows.map((r) => ({
            value: r.delta,
            itemStyle: {
              color: ((c) => (c === 'pos' ? tok.positive : c === 'neg' ? tok.negative : tok.dot))(colourOf(r.delta)),
              borderRadius: 0,
            },
          })),
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: tok.ink, width: 1, type: 'solid' },
            label: { show: false },
            data: [{ yAxis: 0 }],
          },
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, granularity, good, coarse, narrow, tok, t]);

  return <BaseChart option={option} resetLabel={t.resetZoom} ariaLabel={t.periodAria(rows.length)} />;
}
