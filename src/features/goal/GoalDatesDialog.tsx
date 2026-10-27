import { useEffect, useId, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useT } from '@/i18n';
import { editGoalDates, todayISO } from '@/domain';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { setGoalHistory } from '@/features/log/actions';
import type { Goal } from '@/types';

/**
 * Change when a goal started and, for a past goal, when it ended. The current
 * goal has no end date. Overlapping another goal is refused with its name.
 * A bottom sheet on phones, a dialog from 640px; saving shows an undo toast.
 */
export function GoalDatesDialog({
  index,
  name,
  onClose,
}: {
  index: number | null;
  name: (g: Goal) => string;
  onClose: () => void;
}) {
  const t = useT();
  const ids = { start: useId(), end: useId(), err: useId() };
  const goals = useStore((s) => s.goals);
  const goal = index != null ? (goals[index] ?? null) : null;
  const today = todayISO();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setStart(goal.setOn);
      setEnd(goal.endedOn ?? '');
      setError(null);
    }
  }, [goal]);

  const current = goal?.endedOn === null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (index == null || !goal || !start || (!current && !end)) return;
    const res = editGoalDates(goals, index, start, current ? null : end, today);
    if ('error' in res) {
      setError(
        res.error === 'order'
          ? t.gErrOrder
          : res.error === 'future'
            ? t.gErrFuture
            : t.gErrOverlap(res.other ? name(res.other) : ''),
      );
      return;
    }
    setGoalHistory(res.goals, t.tGoalDatesSaved, t);
    onClose();
  }

  return (
    <Dialog.Root open={goal !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex animate-sheet-in flex-col rounded-t-card border border-border bg-surface
                     sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2
                     sm:animate-fade-in sm:rounded-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <form onSubmit={onSubmit} noValidate className="flex flex-col">
            <div className="px-5 pb-2 pt-5">
              <Dialog.Title className="text-lg font-semibold text-text">{t.gDatesTitle}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[14px] text-muted">
                {goal ? name(goal) : ''}
              </Dialog.Description>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 pb-4 pt-2">
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={ids.start} className="text-[13px] text-muted">
                  {t.gStart}
                </label>
                <input
                  id={ids.start}
                  type="date"
                  value={start}
                  max={!current && end ? end : today}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? ids.err : undefined}
                  onChange={(e) => {
                    setStart(e.target.value);
                    setError(null);
                  }}
                  className="field w-full px-3"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                {current ? (
                  <>
                    <span className="text-[13px] text-muted">{t.gEnd}</span>
                    <p className="flex h-11 items-center text-[15px] text-muted">{t.gEndCurrent}</p>
                  </>
                ) : (
                  <>
                    <label htmlFor={ids.end} className="text-[13px] text-muted">
                      {t.gEnd}
                    </label>
                    <input
                      id={ids.end}
                      type="date"
                      value={end}
                      min={start || undefined}
                      max={today}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? ids.err : undefined}
                      onChange={(e) => {
                        setEnd(e.target.value);
                        setError(null);
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
