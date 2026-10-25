import { roundWeight } from '@/domain';
import { kg } from '@/lib/format';
import { useT } from '@/i18n';
import { Delta } from '@/components/ui/Delta';
import type { Granularity, PeriodAverage } from '@/types';

/**
 * Weekly or monthly averages, newest first. Averages and changes are shown at
 * one decimal, and each change is the difference of the two averages as
 * displayed, so the column always adds up.
 */
export function PeriodTable({ periods, granularity }: { periods: PeriodAverage[]; granularity: Granularity }) {
  const t = useT();
  const rows = periods
    .map((p, i) => ({
      p,
      delta: i > 0 ? roundWeight(roundWeight(p.average) - roundWeight(periods[i - 1].average)) : null,
    }))
    .reverse();
  const name = (p: PeriodAverage) =>
    granularity === 'weekly'
      ? `${t.fmtShort(p.start)} – ${t.fmtShort(p.end)}`
      : t.fmtDate(p.start).replace(/^\d+\s/, '');

  return (
    <>
      <table className="hidden w-full text-[15px] sm:table lg:text-sm">
        <thead className="sticky top-0 z-[1] bg-surface">
          <tr className="border-b border-border text-left text-[13px] text-muted">
            <th scope="col" className="h-10 pr-4 font-normal">{t.colPeriod(granularity)}</th>
            <th scope="col" className="h-10 pr-4 text-right font-normal">{t.colAvg}</th>
            <th scope="col" className="h-10 pr-4 text-right font-normal">{t.colChange}</th>
            <th scope="col" className="h-10 text-right font-normal">{t.colWeighIns}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, delta }) => (
            <tr key={p.start} className="border-b border-rule last:border-b-0">
              <td className="h-12 pr-4 text-text">
                <span className="num">{name(p)}</span>
              </td>
              <td className="num h-12 pr-4 text-right text-text">
                {kg(p.average)}
                <span className="unit">kg</span>
              </td>
              <td className="h-12 pr-4 text-right">
                <Delta value={delta} />
              </td>
              <td className="num h-12 text-right text-muted">{p.measurements}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="sm:hidden">
        {rows.map(({ p, delta }) => (
          <li key={p.start} className="border-b border-rule py-3 last:border-b-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="num text-[15px] text-text">{name(p)}</span>
              <span className="num text-[16px] text-text">
                {kg(p.average)}
                <span className="unit">kg</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-muted">
                {p.measurements} {t.colWeighIns.toLowerCase()}
              </span>
              <Delta value={delta} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
