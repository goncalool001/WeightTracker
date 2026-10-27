import { toast } from 'sonner';
import { UNDO_MS, WEIGHT_MAX, WEIGHT_MIN } from '@/lib/constants';
import { kg } from '@/lib/format';
import { parseWeightCell, todayISO, type CategoryId, type EntryExtras } from '@/domain';
import { useStore } from '@/store/useStore';
import type { T } from '@/i18n';
import type { Goal, WeightEntry } from '@/types';

/**
 * Every change to the data shows a toast with Undo. Undo applies the inverse
 * change through the same store actions, so it also syncs.
 */

const store = () => useStore.getState();

function undone(t: T) {
  toast(t.tUndone, { duration: 2000 });
}

/** Validate the typed weight; returns the number or the error message. */
export function checkWeight(text: string, date: string, t: T): { value: number } | { error: string } {
  if (text.trim() === '') return { error: t.errEmpty };
  const value = parseWeightCell(text);
  if (value == null || value < WEIGHT_MIN || value > WEIGHT_MAX) return { error: t.errRange };
  if (date > todayISO()) return { error: t.errFuture };
  return { value };
}

/**
 * Save (add or replace) one weigh-in with an undo toast. `extras` (note,
 * categories): undefined keeps what the day has, a value sets it, null removes it.
 */
export function saveWeight(date: string, value: number, t: T, extras?: EntryExtras): void {
  const { previous } = store().addOrUpdate(date, value, extras);
  const day = t.fmtShort(date);
  const message =
    previous == null || previous.weight === value
      ? previous == null
        ? t.tSaved(kg(value), day)
        : t.tSavedNote(day)
      : t.tReplaced(kg(previous.weight), kg(value), day);
  toast(message, {
    duration: UNDO_MS,
    action: {
      label: t.tUndo,
      onClick: () => {
        if (previous == null) store().deleteEntry(date);
        else
          store().addOrUpdate(date, previous.weight, {
            note: previous.note ?? null,
            tags: (previous.tags as CategoryId[] | undefined) ?? null,
          });
        undone(t);
      },
    },
  });
}

/** Delete one weigh-in with an undo toast. */
export function deleteWeight(date: string, t: T): void {
  const removed = store().deleteEntry(date);
  if (!removed) return;
  toast(t.tDeleted(kg(removed.weight), t.fmtShort(date)), {
    duration: UNDO_MS,
    action: {
      label: t.tUndo,
      onClick: () => {
        store().addOrUpdate(removed.date, removed.weight, {
          note: removed.note ?? null,
          tags: (removed.tags as CategoryId[] | undefined) ?? null,
        });
        undone(t);
      },
    },
  });
}

/** Replace the whole dataset (import or delete-all) with an undo toast. */
export function replaceAll(next: WeightEntry[], message: string, t: T): void {
  const before = store().replaceEntries(next);
  toast(message, {
    duration: UNDO_MS,
    action: {
      label: t.tUndo,
      onClick: () => {
        store().replaceEntries(before);
        undone(t);
      },
    },
  });
}

/** Set or remove the current goal with an undo toast. */
export function changeGoal(next: Goal | null, t: T): void {
  const before = store().setGoal(next);
  toast(next ? t.tGoalSaved : t.tGoalRemoved, {
    duration: UNDO_MS,
    action: {
      label: t.tUndo,
      onClick: () => {
        store().restoreGoals(before);
        undone(t);
      },
    },
  });
}

/** Replace the goal history (an edit or a deletion) with an undo toast. */
export function setGoalHistory(next: Goal[], message: string, t: T): void {
  const before = store().goals;
  store().restoreGoals(next);
  toast(message, {
    duration: UNDO_MS,
    action: {
      label: t.tUndo,
      onClick: () => {
        store().restoreGoals(before);
        undone(t);
      },
    },
  });
}
