import { useT } from '@/i18n';

const Bar = ({ className }: { className: string }) => (
  <div aria-hidden="true" className={`rounded-md bg-active ${className}`} />
);

/**
 * The Today layout with each value replaced by a flat grey bar at its real
 * size. No shimmer and no pulse; nothing moves when the data lands.
 */
export function LoadingState() {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t.loading}</span>
      <div className="flex flex-col gap-3 pt-1 lg:pt-4">
        <Bar className="h-[30px] w-[85%] lg:h-[44px] lg:w-[70%]" />
        <Bar className="h-[18px] w-[55%]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel flex flex-col gap-2 p-4 lg:min-h-[128px]">
            <Bar className="h-[16px] w-20" />
            <Bar className="h-[26px] w-24" />
            <Bar className="mt-auto h-[14px] w-28" />
          </div>
        ))}
      </div>
      <div className="panel h-[200px]" />
      <div className="panel h-[330px] sm:h-[390px] lg:h-[430px]" />
    </div>
  );
}
