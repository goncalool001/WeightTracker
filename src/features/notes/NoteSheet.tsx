import { useEffect, useId, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { NOTE_MAX, type CategoryId } from '@/domain';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from './CategoryPicker';

interface NoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already formatted, e.g. "25 Oct". */
  dateLabel: string;
  /** The day before, formatted: what the note describes. */
  prevDayLabel: string;
  tags: CategoryId[];
  note: string;
  /** Called with the edited draft when the sheet is confirmed. */
  onDone: (tags: CategoryId[], note: string) => void;
}

/**
 * Categories and free text for one weigh-in. They describe the day before
 * (yesterday's night out explains this morning's weight). A bottom sheet on phones and a
 * centred dialog from 640px. It edits a draft: nothing is saved until the
 * weigh-in itself is saved.
 */
export function NoteSheet({ open, onOpenChange, dateLabel, prevDayLabel, tags, note, onDone }: NoteSheetProps) {
  const t = useT();
  const textId = useId();
  const [draftTags, setDraftTags] = useState<CategoryId[]>(tags);
  const [draftNote, setDraftNote] = useState(note);

  useEffect(() => {
    if (open) {
      setDraftTags(tags);
      setDraftNote(note);
    }
  }, [open, tags, note]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] animate-sheet-in flex-col sm:animate-fade-in rounded-t-card border border-border
                     bg-surface sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[84vh] sm:w-[560px]
                     sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Dialog.Title className="text-lg font-semibold text-text">{t.noteSheetTitle(dateLabel)}</Dialog.Title>
            <Dialog.Close
              aria-label={t.close}
              className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-active"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="px-5 pb-3 text-[15px] text-muted lg:text-sm">
            {t.noteAbout(prevDayLabel)}
          </Dialog.Description>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <CategoryPicker value={draftTags} onChange={setDraftTags} />
            <label htmlFor={textId} className="mb-1.5 mt-5 block text-[13px] text-muted">
              {t.freeText}
            </label>
            <input
              id={textId}
              type="text"
              enterKeyHint="done"
              autoComplete="off"
              maxLength={NOTE_MAX}
              value={draftNote}
              placeholder={t.noteExample}
              onChange={(e) => setDraftNote(e.target.value)}
              className="field"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDraftTags([]);
                setDraftNote('');
              }}
            >
              {t.clear}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onDone(draftTags, draftNote);
                onOpenChange(false);
              }}
            >
              {t.done}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
