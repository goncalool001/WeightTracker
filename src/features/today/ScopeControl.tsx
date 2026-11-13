import { useId, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronDown, X } from 'lucide-react';
import { scopeOptions, type GoalPhase, type ScopeOption } from '@/domain';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useScope } from '@/store/selectors';
import { cn } from '@/lib/cn';
import { trimKg } from './headline';

/**
 * What Today covers: the goal in force since it was set (the default), an
 * earlier goal, or the whole history. One quiet pill that names the period
 * being shown; it opens the list of choices (a bottom sheet on phones, a
 * dialog from 640px). Hidden while there is no goal to choose between.
 *
 * It is a pill with a caret, not a segmented control, so it does not read as
 * a second copy of the chart's range buttons further down.
 */
export function ScopeControl() {
  const t = useT();
  const goals = useStore((s) => s.goals);
  const setScope = useStore((s) => s.setScope);
  const scope = useScope();
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const options = scopeOptions(goals);
  if (options.length === 0) return null;

  const short = (p: GoalPhase | null) =>
    !p
      ? t.scopeAll
      : p.goal.mode === 'lose'
        ? t.sLose(trimKg(p.goal.target))
        : p.goal.mode === 'gain'
          ? t.sGain(trimKg(p.goal.target))
          : t.sMaintain(trimKg(p.goal.low), trimKg(p.goal.high));
  const full = (p: GoalPhase | null) =>
    !p
      ? t.scopeAll
      : p.goal.mode === 'lose'
        ? t.hLose(trimKg(p.goal.target))
        : p.goal.mode === 'gain'
          ? t.hGain(trimKg(p.goal.target))
          : t.hMaintain(trimKg(p.goal.low), trimKg(p.goal.high));
  const dates = (p: GoalPhase | null, fmt: (iso: string) => string) =>
    !p ? null : p.to ? t.hRange(fmt(p.from), fmt(p.to)) : t.hSince(fmt(p.from));

  const selected = options.find((o) => o.key === scope.key) ?? options[options.length - 1];

  function choose(o: ScopeOption) {
    if (o.key !== scope.key) setScope(o.key);
    setOpen(false);
  }

  // Arrow keys walk the list, as in a radio group.
  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    if (rows.length === 0) return;
    let next = -1;
    if (step) next = (rows.indexOf(document.activeElement as HTMLButtonElement) + step + rows.length) % rows.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = rows.length - 1;
    if (next < 0) return;
    e.preventDefault();
    rows[next].focus();
  }

  const selectedDates = dates(selected.phase, t.fmtShort);

  return (
    <div className="flex min-w-0">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            // The name holds the visible label word for word (voice control).
            aria-label={`${t.scopeLabel}: ${short(selected.phase)}${selectedDates ? ` ${selectedDates}` : ''}`}
            className="inline-flex h-11 min-w-0 max-w-full items-center gap-2 rounded-full border border-control px-4 text-sm
                       font-medium text-text transition-colors hover:bg-active lg:h-9"
          >
            <span className="truncate">{short(selected.phase)}</span>
            {selectedDates && <span className="num shrink-0 font-normal text-muted">{selectedDates}</span>}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              // Start on the choice in use, not on the first row.
              const current = listRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
              if (current) {
                e.preventDefault();
                current.focus();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] animate-sheet-in flex-col rounded-t-card border border-border
                       bg-surface sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2
                       sm:-translate-y-1/2 sm:animate-fade-in sm:rounded-card"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between pb-1 pl-5 pr-3 pt-3">
              <Dialog.Title id={titleId} className="text-lg font-semibold text-text">
                {t.scopeLabel}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t.close}
                className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-active"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
            <div
              ref={listRef}
              role="radiogroup"
              aria-labelledby={titleId}
              onKeyDown={onKeyDown}
              className="min-h-0 flex-1 overflow-y-auto px-2 pb-3"
            >
              {options.map((o) => {
                const on = o.key === selected.key;
                const when = dates(o.phase, t.fmtDate);
                return (
                  <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(o)}
                    className={cn(
                      'flex min-h-14 w-full items-center gap-3 rounded-inner px-3 py-2 text-left transition-colors hover:bg-active',
                      on && 'bg-active',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('text-[15px] text-text', on && 'font-semibold')}>{full(o.phase)}</span>
                      {when && <span className="num text-[13px] text-muted">{when}</span>}
                    </span>
                    {on && <Check className="h-4 w-4 shrink-0 text-text" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
