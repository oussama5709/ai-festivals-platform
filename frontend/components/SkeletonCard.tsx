export default function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3" aria-hidden="true">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton w-4 h-4 rounded-full" />
      </div>
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-3 w-40 rounded" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
        <div className="skeleton w-5 h-5 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}
