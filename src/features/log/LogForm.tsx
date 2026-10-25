import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { StickyNote } from 'lucide-react';
import { addDaysISO, cleanTags, todayISO, type CategoryId } from '@/domain';
import { kg } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useKeyboardInset } from '@/hooks/useViewport';
import { Button } from '@/components/ui/Button';
import { NoteSheet } from '@/features/notes/NoteSheet';
import { noteText } from '@/features/notes/noteText';
import { checkWeight, saveWeight } from './actions';

/**
 * Log a weigh-in in two taps: tap the weight field (the decimal keypad opens,
 * the date is already today), then tap Save. If the day already has a
 * weigh-in the button says what it replaces.
 *
 * Categories and a free-text note explain the weigh-in. They are edited in a
 * sheet (the note button on the phone bar, "Edit note" on the desktop panel)
 * as a draft, and saved with the weigh-in; a day that already has a weigh-in
 * can save its note alone.
 *
 * `bar` is the thumb-reach bar fixed to the bottom on phones and tablets;
 * `panel` is the desktop panel on the Today screen.
 */
export function LogForm({ variant }: { variant: 'bar' | 'panel' }) {
  const t = useT();
  const entries = useStore((s) => s.entries);
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<CategoryId[]>([]);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inset = useKeyboardInset();
  const ids = { weight: useId(), date: useId(), msg: useId(), title: useId() };

  const existing = useMemo(() => entries.find((e) => e.date === date) ?? null, [entries, date]);
  const dayWord =
    date === today ? t.todayWord : date === addDaysISO(today, -1) ? t.yesterdayWord : t.fmtShort(date);

  // Picking another day shows that day's categories and note.
  useEffect(() => {
    setTags(cleanTags(existing?.tags) ?? []);
    setNote(existing?.note ?? '');
    setTouched(false);
  }, [date, existing?.tags, existing?.note]);

  const noteOnly = text.trim() === '' && existing != null && touched;

  function reset() {
    setText('');
    setError(null);
    setTouched(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const extras = touched ? { tags: tags.length ? tags : null, note: note.trim() || null } : undefined;
    if (noteOnly && existing) {
      saveWeight(date, existing.weight, t, extras);
      reset();
      return;
    }
    const res = checkWeight(text, date, t);
    if ('error' in res) {
      setError(res.error);
      inputRef.current?.focus();
      return;
    }
    saveWeight(date, res.value, t, extras);
    reset();
    if (variant === 'bar') inputRef.current?.blur();
  }

  const message = error;
  const buttonLabel = noteOnly ? t.saveNote : existing ? t.replaceBtn(kg(existing.weight)) : t.save;
  const summary = noteText({ tags, note }, t);
  const count = tags.length + (note.trim() ? 1 : 0);

  const sheet = (
    <NoteSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      dateLabel={t.fmtShort(date)}
      prevDayLabel={t.fmtShort(addDaysISO(date, -1))}
      tags={tags}
      note={note}
      onDone={(nextTags, nextNote) => {
        setTags(nextTags);
        setNote(nextNote);
        setTouched(true);
      }}
    />
  );

  const weightField = (
    <input
      ref={inputRef}
      id={ids.weight}
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      autoComplete="off"
      spellCheck={false}
      value={text}
      placeholder={variant === 'bar' ? 'kg' : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={message ? ids.msg : undefined}
      onChange={(e) => {
        setText(e.target.value);
        if (error) setError(null);
      }}
      className="field min-w-0 flex-1"
    />
  );

  if (variant === 'panel') {
    return (
      <form onSubmit={onSubmit} aria-labelledby={ids.title} className="panel flex flex-col p-5" noValidate>
        <h2 id={ids.title} className="mb-3 text-sm font-semibold text-text">
          {t.logTitle}
        </h2>
        <label htmlFor={ids.date} className="mb-1.5 text-[13px] text-muted">
          {t.dateLbl}
        </label>
        <input
          id={ids.date}
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value || today)}
          className="field mb-3"
        />
        <label htmlFor={ids.weight} className="mb-1.5 text-[13px] text-muted">
          {t.weightLbl}
        </label>
        <div className="mb-3 flex">{weightField}</div>
        <span className="mb-1.5 text-[13px] text-muted">{t.noteLbl}</span>
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-text" title={summary || undefined}>
            {summary || <span className="text-muted">{'—'}</span>}
          </p>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            {count ? t.editNote : t.addNote}
          </Button>
        </div>
        <p
          id={ids.msg}
          aria-live="polite"
          className={cn('mt-2 min-h-[20px] text-[13px]', error ? 'text-negative' : 'text-muted')}
        >
          {message}
        </p>
        <Button type="submit" variant="primary" className="w-full">
          {buttonLabel}
        </Button>
        {sheet}
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-label={t.logTitle}
      noValidate
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface lg:hidden"
      style={{
        transform: inset ? `translateY(-${inset}px)` : undefined,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      {message && (
        <p id={ids.msg} aria-live="polite" className={cn('pt-2 text-[14px]', error ? 'text-negative' : 'text-muted')}>
          {message}
        </p>
      )}
      {summary && <p className="truncate pt-1 text-[14px] text-text">{summary}</p>}
      <div className="flex items-center gap-2 pt-2">
        <label className="relative flex h-11 shrink-0 items-center rounded-full bg-active px-4 text-[15px] font-medium text-text">
          <span aria-hidden="true">{dayWord}</span>
          <input
            id={ids.date}
            type="date"
            value={date}
            max={today}
            aria-label={`${t.dateLbl}: ${dayWord}`}
            onChange={(e) => setDate(e.target.value || today)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <label htmlFor={ids.weight} className="sr-only">
          {t.weightLbl}
        </label>
        {weightField}
        <button
          type="button"
          aria-label={count ? `${t.editNote} (${count})` : t.addNote}
          aria-haspopup="dialog"
          onClick={() => setSheetOpen(true)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-active"
        >
          <StickyNote className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="num absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-medium text-on-primary"
            >
              {count}
            </span>
          )}
        </button>
        <Button type="submit" variant="primary">
          {buttonLabel}
        </Button>
      </div>
      {sheet}
    </form>
  );
}
