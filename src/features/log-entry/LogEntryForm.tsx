import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { WEIGHT_MAX, WEIGHT_MIN, WEIGHT_STEP } from '@/lib/constants';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

/** Local calendar date as `YYYY-MM-DD` (avoids the UTC shift of toISOString). */
function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const inputClass =
  'h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text ' +
  'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

/** "Log weight" panel: pick a date + weight and upsert the entry. */
export function LogEntryForm() {
  const t = useT();
  const entries = useStore((s) => s.entries);
  const addOrUpdate = useStore((s) => s.addOrUpdate);

  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (weight === '' && entries.length > 0) {
      setWeight(entries[entries.length - 1].weight.toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(weight);
    if (!date) {
      toast.error(t.dateLbl + ' required.');
      return;
    }
    if (Number.isNaN(value) || value < WEIGHT_MIN || value > WEIGHT_MAX) {
      toast.error(`${t.weightKgLbl}: ${WEIGHT_MIN}–${WEIGHT_MAX} kg`);
      return;
    }
    const action = addOrUpdate(date, value);
    const dateLabel = t.fmtDate(date);
    const weightLabel = `${value.toFixed(1)} kg`;
    toast.success(
      action === 'added'
        ? t.toastAdded(dateLabel, weightLabel)
        : t.toastUpdated(dateLabel, weightLabel),
    );
  }

  return (
    <form onSubmit={onSubmit} className="card themed p-4">
      <h2 className="mb-3 text-sm font-bold text-text">{t.logWeight}</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">
            {t.dateLbl}
          </span>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">
            {t.weightKgLbl}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step={WEIGHT_STEP}
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            value={weight}
            placeholder="0.0"
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
        </label>
        <Button type="submit" variant="success" className="sm:w-auto">
          <Save className="h-4 w-4" />
          {t.save}
        </Button>
      </div>
    </form>
  );
}
