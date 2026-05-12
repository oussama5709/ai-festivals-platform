import Navbar from '@/components/Navbar';
import SkeletonCard from '@/components/SkeletonCard';

export default function EventsLoading() {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="w-60 shrink-0 hidden lg:block">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-8 rounded-lg" />
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-8 w-48 rounded-lg" />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading events">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
