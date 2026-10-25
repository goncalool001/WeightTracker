import { todayISO, type Status } from '@/domain';
import { abs1, kg } from '@/lib/format';
import type { T } from '@/i18n';

/** A band edge or target without a needless ".0": 76 → "76", 76.5 → "76.5". */
export function trimKg(n: number): string {
  return Number.isInteger(n) ? String(n) : kg(n);
}

/** Keep "76.5 kg" and "76–78" on one line. */
const NBSP = '\u00a0';
const JOIN = '\u2060';
const unbreakable = (s: string) =>
  s.replace(/ kg/g, `${NBSP}kg`).replace(/(\d)–(\d)/g, `$1${JOIN}–${JOIN}$2`);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The h1 sentence and the line under it, built from the status so the
 * headline and the KPIs can never disagree.
 */
export function headline(s: Status, t: T): { h1: string; sub: string } {
  if (s.phase === 'empty' || !s.latest) {
    return { h1: t.emptyHead, sub: t.emptySub };
  }
  const parts = [`${kg(s.latest.weight)} kg`];

  if (s.phase === 'maintain' && s.band) {
    if (s.bandPosition === 'inside') parts.push(t.headInBand(trimKg(s.band.low), trimKg(s.band.high)));
    else if (s.bandPosition === 'above') parts.push(t.headAboveBand(abs1(s.bandDistance ?? 0)));
    else parts.push(t.headBelowBand(abs1(s.bandDistance ?? 0)));
  } else if (s.phase === 'reach' && s.goal && s.toGo != null) {
    parts.push(t.headToGo(abs1(s.toGo), trimKg(s.goal.target)));
  } else if (s.phase === 'reached' && s.goal) {
    parts.push(t.headReached(trimKg(s.goal.target)));
  }

  if (s.trend) parts.push(t.trendWord[s.trend]);

  const today = todayISO();
  const when =
    s.latest.date === today ? cap(t.fmtDay(today)) : cap(t.lastWeighIn(t.fmtShort(s.latest.date)));
  const avg = s.avg7 != null ? t.avg7Line(kg(s.avg7), s.avg7Count) : null;
  return { h1: unbreakable(parts.join(' · ')), sub: unbreakable([when, avg].filter(Boolean).join(' · ')) };
}
