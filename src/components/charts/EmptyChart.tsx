import { LineChart } from 'lucide-react';

/** Friendly placeholder shown when a chart has no data to display. */
export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-muted">
      <LineChart className="h-10 w-10 opacity-50" strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
