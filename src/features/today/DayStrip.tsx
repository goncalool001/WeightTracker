import { addDaysISO, consecutiveDays, todayISO, type Status } from '@/domain';
import { kg } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import type { WeightEntry } from '@/types';

/**
 * The last 30 calendar days, one cell each, ending on the latest weigh-in.
 * Maintaining: teal = inside the band, grey = outside, outline = no weigh-in.
 * Otherwise: grey = weighed, outline = no weigh-in. Days without a weigh-in
 * stay empty; nothing is filled in.
 */
export function DayStrip({ s, entries }: { s: Status; entries: WeightEntry[] }) {
  const t = useT();
  if (!s.latest) return null;
  const band = s.phase === 'maintain' ? s.band : null;
  const byDate = new Map(entries.map((e) => [e.date, e.weight]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = addDaysISO(s.latest!.date, i - 29);
    return { date, w: byDate.get(date) ?? null };
  });
  const weighed = days.filter((d) => d.w != null);
  const inBand = band ? weighed.filter((d) => d.w! >= band.low && d.w! <= band.high).length : 0;
  const summary = band ? t.stripInBand(inBand, weighed.length) : t.stripLogged(weighed.length);
  // Days in a row with a weigh-in, ending today (or yesterday, before today's).
  const streak = consecutiveDays(entries, todayISO());

  return (
    <div className="mt-5 border-t border-rule pt-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-[14px] font-medium text-text lg:text-[13px]">{t.stripTitle}</h3>
        <ul className="flex flex-wrap gap-x-3 text-[13px] text-muted">
          {band ? (
            <>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
                {t.sInBand}
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px] bg-cell-off" />
                {t.sOut}
              </li>
            </>
          ) : (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px] bg-cell-off" />
              {t.sWeighed}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px] border border-control" />
            {t.sNone}
          </li>
        </ul>
      </div>
      <ol role="img" aria-label={summary} className="flex gap-[3px]">
        {days.map((d) => {
          const inside = band && d.w != null && d.w >= band.low && d.w <= band.high;
          return (
            <li
              key={d.date}
              title={`${t.fmtShort(d.date)}: ${d.w != null ? `${kg(d.w)} kg` : t.sNone}`}
              className={cn(
                'h-8 min-w-0 flex-1 rounded-[3px]',
                d.w == null ? 'border border-control' : inside ? 'bg-accent' : 'bg-cell-off',
              )}
            />
          );
        })}
      </ol>
      <div className="num mt-1 flex justify-between text-[13px] text-muted">
        <span>{t.fmtShort(days[0].date)}</span>
        <span>{t.fmtShort(days[29].date)}</span>
      </div>
      <p className="mt-3 text-[15px] text-text lg:text-sm">
        {summary}
        {streak >= 2 && <> {t.streak(streak)}</>}
      </p>
    </div>
  );
}
