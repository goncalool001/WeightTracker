/** Skeleton shown during the initial async hydrate from IndexedDB. */
export function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card themed h-24 animate-pulse bg-surface-2/60"
          />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="card themed h-[360px] animate-pulse bg-surface-2/60" />
        <div className="card themed h-[360px] animate-pulse bg-surface-2/60" />
      </div>
    </div>
  );
}
