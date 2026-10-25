import { CATEGORY_GROUPS, type CategoryId } from '@/domain';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

/**
 * The categories, grouped, as toggle chips. Any number can be on; each chip
 * is a button with `aria-pressed`, and each group is a fieldset named by its
 * legend, so a screen reader hears "Food, Very salty, pressed".
 */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: CategoryId[];
  onChange: (next: CategoryId[]) => void;
}) {
  const t = useT();
  const on = new Set(value);

  function toggle(id: CategoryId) {
    const next = new Set(on);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(CATEGORY_GROUPS.flatMap((g) => g.items).filter((c) => next.has(c)));
  }

  return (
    <div className="flex flex-col gap-4">
      {CATEGORY_GROUPS.map((g) => (
        <fieldset key={g.id}>
          <legend className="mb-2 text-[13px] text-muted">{t.catGroup[g.id]}</legend>
          <div className="flex flex-wrap gap-2">
            {g.items.map((id) => {
              const pressed = on.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggle(id)}
                  className={cn(
                    'min-h-11 rounded-full border px-3.5 text-[15px] transition-colors lg:min-h-9 lg:text-sm',
                    pressed
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-control bg-raised text-text hover:bg-active',
                  )}
                >
                  {t.cat[id]}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
