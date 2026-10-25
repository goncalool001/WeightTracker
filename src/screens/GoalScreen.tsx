import { useEffect, useId, useMemo, useState } from 'react';
import {
  countInBand,
  currentGoal,
  goalReachedOn,
  isTargetGoal,
  makeGoal,
  parseWeightCell,
  todayISO,
} from '@/domain';
import { WEIGHT_MAX, WEIGHT_MIN } from '@/lib/constants';
import { abs1 } from '@/lib/format';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useStatus } from '@/store/selectors';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { changeGoal } from '@/features/log/actions';
import { trimKg } from '@/features/today/headline';
import { kg } from '@/lib/format';
import { ScreenTitle } from './ScreenTitle';
import type { Goal, GoalMode } from '@/types';

const valid = (n: number | null): n is number => n != null && n >= WEIGHT_MIN && n <= WEIGHT_MAX;

/**
 * Goal: lose or gain to a target weight, or maintain a range; see what it means against
 * your own weigh-ins before saving, and keep every past goal in a history.
 * Settings layout: a label column (4) beside the panel (8) from 1024px.
 */
export function GoalScreen() {
  const t = useT();
  const ids = { form: useId(), hist: useId(), target: useId(), low: useId(), high: useId(), err: useId(), hint: useId() };
  const entries = useStore((s) => s.entries);
  const goals = useStore((s) => s.goals);
  const status = useStatus();
  const goal = currentGoal(goals);

  // A range suggestion around the 7-day average when there is none yet.
  const centre = Math.round(status.avg7 ?? status.latest?.weight ?? 75);
  const [mode, setMode] = useState<GoalMode>(goal?.mode ?? (status.phase === 'reached' ? 'maintain' : 'lose'));
  const [target, setTarget] = useState(isTargetGoal(goal) ? trimKg(goal.target) : '');
  const [low, setLow] = useState(goal?.mode === 'maintain' ? trimKg(goal.low) : String(centre - 1));
  const [high, setHigh] = useState(goal?.mode === 'maintain' ? trimKg(goal.high) : String(centre + 1));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [mode, target, low, high]);

  const preview = useMemo(() => {
    const latest = entries[entries.length - 1];
    if (!latest) return null;
    if (mode === 'maintain') {
      const lo = parseWeightCell(low);
      const hi = parseWeightCell(high);
      if (!valid(lo) || !valid(hi) || lo === hi) return null;
      const share = countInBand(entries, latest.date, 30, Math.min(lo, hi), Math.max(lo, hi));
      return share.total ? t.previewMaintain(share.inBand, share.total) : null;
    }
    const tg = parseWeightCell(target);
    if (!valid(tg) || tg === latest.weight) return null;
    return t.previewReach(abs1(latest.weight - tg), latest.weight > tg ? 'above' : 'below');
  }, [mode, target, low, high, entries, t]);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== 'maintain') {
      const tg = parseWeightCell(target);
      if (!valid(tg)) return setError(t.errRange);
      // The target has to lie in the direction the goal names.
      const now = entries[entries.length - 1]?.weight;
      if (now != null && mode === 'lose' && tg >= now) return setError(t.errLoseAbove(kg(now)));
      if (now != null && mode === 'gain' && tg <= now) return setError(t.errGainBelow(kg(now)));
      changeGoal(makeGoal(mode, { target: tg }, todayISO()), t);
    } else {
      const lo = parseWeightCell(low);
      const hi = parseWeightCell(high);
      if (!valid(lo) || !valid(hi) || lo === hi) return setError(t.errBand);
      changeGoal(makeGoal('maintain', { low: lo, high: hi }, todayISO()), t);
    }
  }

  const history = [...goals].reverse();
  const goalName = (g: Goal) =>
    g.mode === 'lose'
      ? t.hLose(trimKg(g.target))
      : g.mode === 'gain'
        ? t.hGain(trimKg(g.target))
        : t.hMaintain(trimKg(g.low), trimKg(g.high));
  const field = 'field max-w-[160px]';

  return (
    <>
      <ScreenTitle title={t.goalTitle} />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:pt-5">
          <h2 id={ids.form} className="text-[17px] font-semibold text-text lg:text-base">
            {t.currentGoal}
          </h2>
          <p className="mt-1 text-[15px] text-muted lg:text-sm">
            {goal ? goalName(goal) : t.noGoal}
          </p>
        </div>

        <form
          onSubmit={onSave}
          aria-labelledby={ids.form}
          noValidate
          className="panel flex flex-col gap-4 p-4 sm:p-5 lg:col-span-8"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] text-muted">{t.modeLabel}</legend>
            <Segmented<GoalMode>
              ariaLabel={t.modeLabel}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'lose', label: t.modeLose },
                { value: 'gain', label: t.modeGain },
                { value: 'maintain', label: t.modeMaintain },
              ]}
              className="self-start"
            />
          </fieldset>

          {mode !== 'maintain' ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.target} className="text-[13px] text-muted">
                {t.targetLbl}
              </label>
              <input
                id={ids.target}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={target}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? ids.err : undefined}
                onChange={(e) => setTarget(e.target.value)}
                className={field}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={ids.low} className="text-[13px] text-muted">
                    {t.lowLbl}
                  </label>
                  <input
                    id={ids.low}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={low}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={`${ids.hint}${error ? ` ${ids.err}` : ''}`}
                    onChange={(e) => setLow(e.target.value)}
                    className={field}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={ids.high} className="text-[13px] text-muted">
                    {t.highLbl}
                  </label>
                  <input
                    id={ids.high}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={high}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={`${ids.hint}${error ? ` ${ids.err}` : ''}`}
                    onChange={(e) => setHigh(e.target.value)}
                    className={field}
                  />
                </div>
              </div>
              <p id={ids.hint} className="text-[13px] text-muted">
                {t.bandHint}
              </p>
            </div>
          )}

          <p aria-live="polite" className="min-h-[22px] text-[15px] text-text lg:text-sm">
            {preview}
          </p>
          {error && (
            <p id={ids.err} role="alert" className="-mt-2 text-[14px] text-negative">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary">
              {t.saveGoal}
            </Button>
            {goal && (
              <Button variant="ghost" onClick={() => changeGoal(null, t)}>
                {t.removeGoal}
              </Button>
            )}
          </div>
        </form>

        <div className="lg:col-span-4 lg:pt-5">
          <h2 id={ids.hist} className="text-[17px] font-semibold text-text lg:text-base">
            {t.historyTitle}
          </h2>
        </div>
        <section aria-labelledby={ids.hist} className="panel p-4 sm:p-5 lg:col-span-8">
          {history.length === 0 ? (
            <p className="text-[15px] text-muted">{t.historyEmpty}</p>
          ) : (
            <ul>
              {history.map((g) => {
                const reached = goalReachedOn(g, entries);
                return (
                  <li
                    key={`${g.setOn}-${g.mode}-${g.low}-${g.high}`}
                    className="flex flex-col gap-0.5 border-b border-rule py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-text lg:text-sm">
                        {goalName(g)}
                      </span>
                      {g.endedOn === null && (
                        <span className="rounded-full bg-pill-pos px-2 py-0.5 text-[12px] font-medium text-pill-pos-ink">
                          {t.hCurrent}
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] tabular-nums text-muted lg:text-[13px]">
                      {g.endedOn ? t.hRange(t.fmtDate(g.setOn), t.fmtDate(g.endedOn)) : t.hSince(t.fmtDate(g.setOn))}
                      {isTargetGoal(g) &&
                        ` · ${reached ? t.hReached(t.fmtShort(reached.date), kg(reached.weight)) : g.endedOn ? t.hNotReached : t.hNotYet}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
