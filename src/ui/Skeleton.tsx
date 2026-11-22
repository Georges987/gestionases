export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100"><Skeleton className="h-5 w-1/4" /></div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-32 mt-2" /></div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
