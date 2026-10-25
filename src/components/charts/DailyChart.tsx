import { useMemo } from 'react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { addDaysISO, averageGaps, dayNumber, goodDirection, isTargetGoal, linearFit } from '@/domain';
import { kg, signed } from '@/lib/format';
import type { T } from '@/i18n';
import type { CalendarAveragePoint, Goal, Overlay, WeightEntry } from '@/types';
import { tooltipBase, useChartTokens } from './chartTokens';
import { noteText } from '@/features/notes/noteText';
import { niceYAxis } from './paddedRange';
import { BaseChart } from './BaseChart';

interface DailyChartProps {
  /** Weigh-ins in the active range. */
  entries: WeightEntry[];
  /** Every weigh-in, for the change against the previous one. */
  all: WeightEntry[];
  /** 7-day calendar average for each day of the range. */
  series: CalendarAveragePoint[];
  goal: Goal | null;
  overlay: Overlay;
  /** Touch screen: read on drag, no zoom. */
  coarse: boolean;
  narrow: boolean;
  /**
   * The period before, to compare: its 7-day average and how many days to
   * shift it forward so it lines up with this one. Null when not comparing.
   */
  previous?: { series: CalendarAveragePoint[]; shift: number } | null;
  t: T;
}

/** Notes are the user's own text; the tooltip renders HTML, so escape them. */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Local-midnight timestamp for an ISO date, so axis ticks land on days. */
function ms(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** The local calendar day of a timestamp, as ISO. */
function isoOf(t: number): string {
  const d = new Date(t + 12 * 3_600_000); // noon guards against DST edges
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Daily weight. Weigh-ins are dots and are never joined, so a gap between
 * weigh-ins is not drawn as if it had been measured. The one teal line is the
 * 7-day calendar average; where a week holds fewer than 2 weigh-ins it turns
 * into a dashed bridge.
 * The maintenance band is a pale field; a reach target is a dashed line.
 * Only the latest, lowest and highest weigh-ins carry a value label; every
 * other value is read by hovering or by dragging a finger along the chart.
 */
export function DailyChart({ entries, all, series, goal, overlay, coarse, narrow, previous, t }: DailyChartProps) {
  const tok = useChartTokens();

  const option = useMemo<EChartsOption>(() => {
    const weights = entries.map((e) => e.weight);
    const avgValues = series.map((p) => p.average).filter((v): v is number => v != null);
    const refs = goal ? (goal.mode === 'maintain' ? [goal.low, goal.high] : [goal.target]) : [];
    const prevValues = (previous?.series ?? []).map((p) => p.average).filter((v): v is number => v != null);
    const { min, max, interval } = niceYAxis([...weights, ...avgValues, ...prevValues], refs, narrow ? 3 : 4);
    // The previous period, keyed by the day it lines up with in this one.
    const prevByDate = new Map(
      (previous?.series ?? []).map((p) => [addDaysISO(p.date, previous!.shift), p] as const),
    );

    const xMin = entries.length ? ms(entries[0].date) : undefined;
    const xMax = entries.length ? ms(entries[entries.length - 1].date) : undefined;
    const byDate = new Map(all.map((e, i) => [e.date, i]));
    const avgByDate = new Map(series.map((p) => [p.date, p.average]));

    // Value labels on the latest, lowest and highest weigh-in only.
    const last = entries.length - 1;
    let lo = 0;
    let hi = 0;
    entries.forEach((e, i) => {
      if (e.weight < entries[lo].weight) lo = i;
      if (e.weight > entries[hi].weight) hi = i;
    });
    const labelled = new Map<number, 'top' | 'bottom'>([
      [hi, 'top'],
      [lo, 'bottom'],
      [last, entries[last]?.weight === entries[lo]?.weight ? 'bottom' : 'top'],
    ]);

    const dotData = entries.map((e, i) => {
      const pos = labelled.get(i);
      const isLast = i === last;
      return {
        value: [ms(e.date), e.weight],
        symbolSize: isLast ? (narrow ? 8 : 9) : narrow ? 5 : 6,
        itemStyle: { color: isLast ? tok.ink : tok.dot },
        label: pos
          ? {
              show: true,
              position: pos,
              distance: 6,
              formatter: kg(e.weight),
              color: tok.ink,
              fontSize: 12,
              fontFamily: tok.font,
            }
          : undefined,
      };
    });

    const series_: SeriesOption[] = [
      {
        id: 'weighins',
        name: t.lWeighIn,
        type: 'scatter',
        data: dotData,
        z: 3,
        markArea:
          goal?.mode === 'maintain'
            ? {
                silent: true,
                itemStyle: { color: tok.accentSoft },
                data: [[{ yAxis: goal.low }, { yAxis: goal.high }]],
              }
            : undefined,
        markLine:
          isTargetGoal(goal)
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: { color: tok.ink, type: 'dashed', width: 1 },
                // Named in the legend under the chart; a label inside the plot
                // collided with the value labels.
                label: { show: false },
                data: [{ yAxis: goal.target }],
              }
            : undefined,
      },
    ];

    if (overlay === 'ma') {
      series_.push({
        id: 'avg',
        name: t.overlayMa,
        type: 'line',
        showSymbol: false,
        smooth: false,
        connectNulls: false,
        data: series.map((p) => [ms(p.date), p.average == null ? null : Number(p.average.toFixed(2))]),
        lineStyle: { color: tok.accent, width: 2 },
        itemStyle: { color: tok.accent },
        emphasis: { disabled: true },
        z: 2,
      });
      // Where a 7-day window holds fewer than 2 weigh-ins there is no average:
      // the two sides are joined by a dashed segment so the line does not
      // look broken, while showing that nothing was measured in between.
      const gaps = averageGaps(series);
      if (gaps.length) {
        series_.push({
          id: 'avg-gaps',
          name: t.lGap,
          type: 'line',
          showSymbol: false,
          connectNulls: false,
          data: gaps.flatMap((g) => [
            [ms(g.from.date), Number(g.from.average.toFixed(2))],
            [ms(g.to.date), Number(g.to.average.toFixed(2))],
            [ms(g.to.date), null],
          ]),
          lineStyle: { color: tok.accent, width: 2, type: [4, 4] },
          emphasis: { disabled: true },
          silent: true,
          z: 2,
        });
      }
    } else if (entries.length >= 2) {
      const xs = entries.map((e) => dayNumber(e.date));
      const fit = linearFit(xs, weights);
      const a = entries[0];
      const b = entries[last];
      series_.push({
        id: 'trend',
        name: t.overlayTrend,
        type: 'line',
        showSymbol: false,
        data: [
          [ms(a.date), fit.slope * xs[0] + fit.intercept],
          [ms(b.date), fit.slope * xs[last] + fit.intercept],
        ],
        lineStyle: { color: tok.accent, width: 2, type: 'dashed' },
        emphasis: { disabled: true },
        z: 2,
      });
    }

    // The period before, as a grey line moved forward onto this one.
    if (previous && previous.series.length) {
      series_.push({
        id: 'previous',
        name: t.chartPrev,
        type: 'line',
        showSymbol: false,
        smooth: false,
        connectNulls: false,
        data: previous.series.map((p) => [
          ms(addDaysISO(p.date, previous.shift)),
          p.average == null ? null : Number(p.average.toFixed(2)),
        ]),
        lineStyle: { color: tok.dot, width: 2 },
        emphasis: { disabled: true },
        silent: true,
        z: 1,
      });
    }

    const fmtRow = (label: string, value: string, color?: string) =>
      `<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.7">` +
      `<span style="color:${tok.muted}">${label}</span>` +
      `<span style="font-variant-numeric:tabular-nums;${color ? `color:${color}` : ''}">${value}</span></div>`;

    return {
      backgroundColor: 'transparent',
      animationDuration: 300,
      textStyle: { fontFamily: tok.font },
      grid: { left: 4, right: 24, top: 24, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipBase(tok),
        trigger: 'axis',
        triggerOn: 'mousemove|click',
        axisPointer: { type: 'line', lineStyle: { color: tok.muted, width: 1 }, snap: true },
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{ axisValue: number }>;
          const iso = isoOf(Number(items[0]?.axisValue));
          const idx = byDate.get(iso);
          const w = idx != null ? all[idx] : null;
          const prev = idx != null && idx > 0 ? all[idx - 1] : null;
          const avg = avgByDate.get(iso);
          const day = t.fmtDay(iso);
          let html = `<div style="font-weight:500;margin-bottom:2px">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
          html += fmtRow(t.chartWeight, w ? `${kg(w.weight)} kg` : '—');
          if (avg != null) html += fmtRow(t.chartAvg, `${kg(avg)} kg`);
          const pp = prevByDate.get(iso);
          if (pp?.average != null) html += fmtRow(`${t.chartPrev} (${t.fmtShort(pp.date)})`, `${kg(pp.average)} kg`);
          if (w && prev) {
            const d = Number((w.weight - prev.weight).toFixed(1));
            const good = goodDirection(goal) === 'up' ? d > 0.05 : d < -0.05;
            const color = Math.abs(d) <= 0.05 ? tok.muted : good ? tok.positive : tok.negative;
            const arrow = d < -0.05 ? '▼ ' : d > 0.05 ? '▲ ' : '';
            html += fmtRow(`${t.chartChange} (${t.fmtShort(prev.date)})`, `${arrow}${signed(d)} kg`, color);
          }
          const nt = w ? noteText(w, t) : '';
          if (nt) {
            html += `<div style="margin-top:4px;max-width:240px;white-space:normal;color:${tok.ink}">${escapeHtml(nt)}</div>`;
          }
          return html;
        },
      },
      xAxis: {
        type: 'time',
        min: xMin,
        max: xMax,
        splitNumber: narrow ? 3 : 6,
        axisLine: { lineStyle: { color: tok.grid, width: 1 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: tok.muted,
          fontSize: 12,
          hideOverlap: true,
          // The range edges are not labelled: a forced edge label crowds the
          // first regular tick.
          formatter: (v: number) => {
            if (entries.length > 7 && (v === xMin || v === xMax)) return '';
            // A regular tick just before a month boundary crowds the "1 Sep" label.
            const d = new Date(v);
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
            if (d.getDate() !== 1 && next - v <= 3 * 86_400_000) return '';
            return t.fmtShort(isoOf(v));
          },
        },
      },
      yAxis: {
        type: 'value',
        min,
        max,
        interval,
        axisLabel: { color: tok.muted, fontSize: 12, formatter: (v: number) => String(v) },
        splitLine: { lineStyle: { color: tok.grid, width: 1 } },
      },
      dataZoom: coarse
        ? []
        : [
            {
              type: 'inside',
              xAxisIndex: 0,
              // Ctrl + wheel zooms; a plain wheel keeps scrolling the page.
              zoomOnMouseWheel: 'ctrl',
              moveOnMouseWheel: false,
              moveOnMouseMove: true,
              filterMode: 'none',
            },
          ],
      series: series_,
    };
  }, [entries, all, series, goal, overlay, coarse, narrow, previous, tok, t]);

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const weights = entries.map((e) => e.weight);
  const aria =
    first && latest
      ? t.chartAria(
          entries.length,
          t.fmtDate(first.date),
          t.fmtDate(latest.date),
          kg(Math.min(...weights)),
          kg(Math.max(...weights)),
          kg(latest.weight),
        )
      : t.noDataRange;

  return <BaseChart option={option} resetLabel={t.resetZoom} ariaLabel={aria} />;
}
