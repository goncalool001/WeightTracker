import { useEffect, useId, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useT } from '@/i18n';
import { kg } from '@/lib/format';
import { NOTE_MAX, addDaysISO, cleanTags, type CategoryId } from '@/domain';
import { Button } from '@/components/ui/Button';
import { checkWeight, saveWeight } from '@/features/log/actions';
import { CategoryPicker } from '@/features/notes/CategoryPicker';
import type { WeightEntry } from '@/types';

const sameTags = (a: CategoryId[], b: CategoryId[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Edit one weigh-in: its weight, its categories and its note. A bottom sheet
 * on phones, a dialog from 640px; it scrolls when the categories are long.
 * Saving shows an undo toast.
 */
export function EditDialog({ entry, onClose }: { entry: WeightEntry | null; onClose: () => void }) {
  const t = useT();
  const fieldId = useId();
  const errId = useId();
  const noteId = useId();
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<CategoryId[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setText(kg(entry.weight));
      setNote(entry.note ?? '');
      setTags(cleanTags(entry.tags) ?? []);
      setError(null);
    }
  }, [entry]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entry) return;
    const res = checkWeight(text, entry.date, t);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    const nextNote = note.trim() === '' ? null : note;
    const noteChanged = (nextNote ?? undefined) !== entry.note;
    const tagsChanged = !sameTags(tags, cleanTags(entry.tags) ?? []);
    if (res.value !== entry.weight || noteChanged || tagsChanged) {
      saveWeight(entry.date, res.value, t, { note: nextNote, tags: tags.length ? tags : null });
    }
    onClose();
  }

  return (
    <Dialog.Root open={entry !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] animate-sheet-in flex-col sm:animate-fade-in rounded-t-card border border-border
                     bg-surface sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[84vh] sm:w-[560px]
                     sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="px-5 pb-2 pt-5">
              <Dialog.Title className="text-lg font-semibold text-text">
                {entry ? t.editTitle(t.fmtDay(entry.date)) : ''}
              </Dialog.Title>
              <Dialog.Description className="sr-only">{t.weightLbl}</Dialog.Description>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <label htmlFor={fieldId} className="mb-1.5 mt-2 block text-[13px] text-muted">
                {t.weightLbl}
              </label>
              <input
                id={fieldId}
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                autoComplete="off"
                value={text}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errId : undefined}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                }}
                className="field max-w-[180px]"
              />
              <p id={errId} aria-live="polite" className="mt-2 min-h-[20px] text-[13px] text-negative">
                {error}
              </p>
              {entry && (
                <p className="mb-3 text-[15px] text-muted lg:text-sm">
                  {t.noteAbout(t.fmtShort(addDaysISO(entry.date, -1)))}
                </p>
              )}
              <CategoryPicker value={tags} onChange={setTags} />
              <label htmlFor={noteId} className="mb-1.5 mt-5 block text-[13px] text-muted">
                {t.freeText}
              </label>
              <input
                id={noteId}
                type="text"
                enterKeyHint="done"
                autoComplete="off"
                maxLength={NOTE_MAX}
                value={note}
                placeholder={t.noteExample}
                onChange={(ev) => setNote(ev.target.value)}
                className="field"
              />
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
