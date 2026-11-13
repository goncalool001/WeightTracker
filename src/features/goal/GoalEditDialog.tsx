import { useEffect, useId, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useT } from '@/i18n';
import {
  editGoalDates,
  goalSignature,
  isTargetGoal,
  PACE_MAX,
  PACE_MIN,
  parseWeightCell,
  roundWeight,
  todayISO,
  withGoalValues,
} from '@/domain';
import { kg } from '@/lib/format';
import { WEIGHT_MAX, WEIGHT_MIN } from '@/lib/constants';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { setGoalHistory } from '@/features/log/actions';
import { trimKg } from '@/features/today/headline';
import type { Goal } from '@/types';

const valid = (n: number | null): n is number => n != null && n >= WEIGHT_MIN && n <= WEIGHT_MAX;
/** A typed weight as it will be stored (0.1 kg), so checks see the saved value. */
const parseKg = (s: string) => {
  const n = parseWeightCell(s);
  return n == null ? null : roundWeight(n);
};

/**
 * Edit one goal of the history: its target weight (or range), the pace it
 * aims for, when it started and, for a past goal, when it ended. The kind of
 * goal is not changed here (a goal to lose stays a goal to lose). The current
 * goal has no end date; overlapping another goal is refused with its name.
 * A bottom sheet on phones, a dialog from 640px; saving shows an undo toast.
 */
export function GoalEditDialog({
  index,
  name,
  onClose,
}: {
  index: number | null;
  name: (g: Goal) => string;
  onClose: () => void;
}) {
  const t = useT();
  const ids = { target: useId(), pace: useId(), low: useId(), high: useId(), start: useId(), end: useId(), err: useId() };
  const goals = useStore((s) => s.goals);
  const latest = useStore((s) => s.entries[s.entries.length - 1]);
  const goal = index != null ? (goals[index] ?? null) : null;
  // The fields follow the goal's content, not its object: a cloud echo of the
  // same goal must not reset what is being typed.
  const signature = goalSignature(goal);
  const today = todayISO();
  const [target, setTarget] = useState('');
  const [pace, setPace] = useState('');
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setTarget(trimKg(goal.target));
      setPace(goal.rate != null ? String(goal.rate) : '');
      setLow(trimKg(goal.low));
      setHigh(trimKg(goal.high));
      setStart(goal.setOn);
      setEnd(goal.endedOn ?? '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, signature]);

  const current = goal?.endedOn === null;
  const aims = isTargetGoal(goal);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (index == null || !goal) return;
    if (!start || (!current && !end)) return setError(t.gErrDate);

    let next: Goal;
    if (isTargetGoal(goal)) {
      const tg = parseKg(target);
      if (!valid(tg)) return setError(t.errRange);
      const rate = pace.trim() === '' ? null : parseWeightCell(pace);
      if (pace.trim() !== '' && (rate == null || rate < PACE_MIN || rate > PACE_MAX)) return setError(t.errPace);
      // A new target for the goal in force has to lie ahead, as on the form.
      if (current && tg !== goal.target && latest) {
        if (goal.mode === 'lose' && tg >= latest.weight) return setError(t.errLoseAbove(kg(latest.weight)));
        if (goal.mode === 'gain' && tg <= latest.weight) return setError(t.errGainBelow(kg(latest.weight)));
      }
      next = withGoalValues(goal, { target: tg, rate });
    } else {
      const lo = parseKg(low);
      const hi = parseKg(high);
      if (!valid(lo) || !valid(hi) || lo === hi) return setError(t.errBand);
      next = withGoalValues(goal, { low: lo, high: hi });
    }

    const res = editGoalDates(
      goals.map((g, i) => (i === index ? next : g)),
      index,
      start,
      current ? null : end,
      today,
    );
    if ('error' in res) {
      return setError(
        res.error === 'order'
          ? t.gErrOrder
          : res.error === 'future'
            ? t.gErrFuture
            : t.gErrOverlap(res.other ? name(res.other) : ''),
      );
    }
    setGoalHistory(res.goals, t.tGoalSaved, t);
    onClose();
  }

  const clear = () => setError(null);
  const invalid = error ? true : undefined;
  const described = error ? ids.err : undefined;
  const label = 'text-[13px] text-muted';
  const cell = 'flex min-w-0 flex-col gap-1.5';

  return (
    <Dialog.Root open={goal !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          onCloseAutoFocus={(e) => {
            // No trigger element owns this dialog: send focus back to the Edit
            // button of the goal (its row may have been redrawn by the save).
            const back = document.querySelector<HTMLElement>('[data-goal-edit]:focus, [data-goal-edit="last"]');
            if (back) {
              e.preventDefault();
              back.focus();
            }
          }}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] animate-sheet-in flex-col rounded-t-card border border-border
                     bg-surface sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2
                     sm:-translate-y-1/2 sm:animate-fade-in sm:rounded-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="px-5 pb-2 pt-5">
              <Dialog.Title className="text-lg font-semibold text-text">{t.gEditTitle}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[14px] text-muted">
                {goal ? name(goal) : ''}
              </Dialog.Description>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto px-5 pb-4 pt-2">
              {aims ? (
                <>
                  <div className={cell}>
                    <label htmlFor={ids.target} className={label}>
                      {t.targetLbl}
                    </label>
                    <input
                      id={ids.target}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={target}
                      aria-invalid={invalid}
                      aria-describedby={described}
                      onChange={(e) => {
                        setTarget(e.target.value);
                        clear();
                      }}
                      className="field w-full px-3"
                    />
                  </div>
                  <div className={cell}>
                    <label htmlFor={ids.pace} className={label}>
                      {t.paceShortLbl}
                    </label>
                    <input
                      id={ids.pace}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={pace}
                      placeholder="0.5"
                      aria-invalid={invalid}
                      aria-describedby={described}
                      onChange={(e) => {
                        setPace(e.target.value);
                        clear();
                      }}
                      className="field w-full px-3"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={cell}>
                    <label htmlFor={ids.low} className={label}>
                      {t.lowLbl}
                    </label>
                    <input
                      id={ids.low}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={low}
                      aria-invalid={invalid}
                      aria-describedby={described}
                      onChange={(e) => {
                        setLow(e.target.value);
                        clear();
                      }}
                      className="field w-full px-3"
                    />
                  </div>
                  <div className={cell}>
                    <label htmlFor={ids.high} className={label}>
                      {t.highLbl}
                    </label>
                    <input
                      id={ids.high}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={high}
                      aria-invalid={invalid}
                      aria-describedby={described}
                      onChange={(e) => {
                        setHigh(e.target.value);
                        clear();
                      }}
                      className="field w-full px-3"
                    />
                  </div>
                </>
              )}
              <div className={cell}>
                <label htmlFor={ids.start} className={label}>
                  {t.gStart}
                </label>
                <input
                  id={ids.start}
                  type="date"
                  value={start}
                  max={!current && end ? end : today}
                  aria-invalid={invalid}
                  aria-describedby={described}
                  onChange={(e) => {
                    setStart(e.target.value);
                    clear();
                  }}
                  className="field w-full px-3"
                />
              </div>
              <div className={cell}>
                {current ? (
                  <>
                    <span className={label}>{t.gEnd}</span>
                    <p className="flex h-11 items-center text-[15px] text-muted">{t.gEndCurrent}</p>
                  </>
                ) : (
                  <>
                    <label htmlFor={ids.end} className={label}>
                      {t.gEnd}
                    </label>
                    <input
                      id={ids.end}
                      type="date"
                      value={end}
                      min={start || undefined}
                      max={today}
                      aria-invalid={invalid}
                      aria-describedby={described}
                      onChange={(e) => {
                        setEnd(e.target.value);
                        clear();
                      }}
                      className="field w-full px-3"
                    />
                  </>
                )}
              </div>
              {error && (
                <p id={ids.err} role="alert" className="col-span-2 text-[14px] text-negative">
                  {error}
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
              <Dialog.Close asChild>
                <Button variant="ghost">{t.cancel}</Button>
              </Dialog.Close>
              <Button type="submit" variant="primary">
                {t.save}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
