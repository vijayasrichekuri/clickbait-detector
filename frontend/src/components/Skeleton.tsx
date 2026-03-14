/** Simple skeleton loader for cards and lists */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 rounded-lg bg-slate-700/40 animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 border border-white/[0.06] bg-slate-800/30 space-y-4">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-4/6" />
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2.5 px-2">
          <SkeletonLine className="flex-1 rounded-md" />
          <SkeletonLine className="w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
}
