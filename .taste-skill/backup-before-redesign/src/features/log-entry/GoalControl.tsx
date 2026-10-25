import { useEffect, useState } from 'react';
import { Target, X } from 'lucide-react';
import { WEIGHT_MAX, WEIGHT_MIN, WEIGHT_STEP } from '@/lib/constants';
import { useT } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useGoalProjection } from '@/store/selectors';

const inputClass =
  'h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text ' +
  'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

/** "Goal" panel: set/clear the target weight that drives the goal line and
 *  projected goal date. Debounced to avoid thrashing the charts while typing. */
export function GoalControl() {
  const t = useT();
  const goalWeight = useStore((s) => s.goalWeight);
  const setGoal = useStore((s) => s.setGoal);
  const projection = useGoalProjection();

  const [text, setText] = useState(goalWeight?.toString() ?? '');

  useEffect(() => {
    setText(goalWeight?.toString() ?? '');
  }, [goalWeight]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const value = Number(text);
      if (text === '') {
        if (goalWeight !== null) setGoal(null);
      } else if (!Number.isNaN(value) && value >= WEIGHT_MIN && value <= WEIGHT_MAX) {
        if (value !== goalWeight) setGoal(value);
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="card themed p-4">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-text">
        <Target className="h-4 w-4 text-accent" />
        {t.goalLbl}
      </h2>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">
          {t.targetKg}
        </span>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            step={WEIGHT_STEP}
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            value={text}
            placeholder={t.noneSet}
            onChange={(e) => setText(e.target.value)}
            className={inputClass}
          />
          {text !== '' && (
            <button
              type="button"
              aria-label={t.clearGoal}
              onClick={() => setText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </label>
      <p className="mt-2 min-h-[1rem] text-xs text-muted">
        {goalWeight != null && projection
          ? t.goalOnTrack(goalWeight.toFixed(1), t.fmtDate(projection.date))
          : goalWeight != null
            ? t.goalShownOnCharts
            : t.goalPrompt}
      </p>
    </div>
  );
}
