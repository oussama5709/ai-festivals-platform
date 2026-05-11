'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterSidebar, { Filters } from '@/components/FilterSidebar';
import { fetchEvents, fetchRegions, Event, EventsResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Grid3X3, List, SortAsc, AlertCircle, SearchX } from 'lucide-react';

const DEFAULT_FILTERS: Filters = {
  search: '',
  regions: [],
  categories: [],
  minDate: '',
  maxDate: '',
  minQuality: 0.5,
  isOnline: false,
  isFree: false,
};

type SortOption = 'date' | 'quality' | 'relevance';
type ViewMode = 'grid' | 'list';

export default function EventsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>('date');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRegions()
      .then((regions) => {
        const counts: Record<string, number> = {};
        regions.forEach(({ region, count }) => { counts[region] = count; });
        setRegionCounts(counts);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async (f: Filters, s: SortOption, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEvents({
        search: f.search || undefined,
        region: f.regions.length === 1 ? f.regions[0] : undefined,
        type: f.categories.length === 1 ? f.categories[0] : undefined,
        minDate: f.minDate || undefined,
        maxDate: f.maxDate || undefined,
        minQuality: f.minQuality,
        isOnline: f.isOnline ? true : undefined,
        sort: s,
        page: p,
        limit: 21,
      });
      setData(result);
    } catch {
      setError("We're having trouble loading events right now. Try refreshing in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(filters, sort, page);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, sort, page, load]);

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <FilterSidebar
          filters={filters}
          onChange={handleFiltersChange}
          regionCounts={regionCounts}
        />

        <main className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic>
              {loading
                ? 'Updating results...'
                : error
                ? ''
                : data
                ? `${data.total.toLocaleString()} event${data.total !== 1 ? 's' : ''} found`
                : ''}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                {(['date', 'quality', 'relevance'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setPage(1); }}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize',
                      sort === opt
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={sort === opt}
                    aria-label={`Sort by ${opt}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    view === 'grid' ? 'bg-background text-foreground' : 'text-muted-foreground'
                  )}
                  aria-pressed={view === 'grid'}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" aria-hidden />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    view === 'list' ? 'bg-background text-foreground' : 'text-muted-foreground'
                  )}
                  aria-pressed={view === 'list'}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 text-sm" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              <p>{error}</p>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className={cn(
              'grid gap-4',
              view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )} aria-label="Loading events">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Events grid */}
          {!loading && !error && data && data.events.length > 0 && (
            <div className={cn(
              'grid gap-4',
              view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {data.events.map((event: Event, i: number) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data && data.events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <SearchX className="w-7 h-7 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground">No events match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try expanding your search or selecting more regions.
                </p>
              </div>
              <button
                onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && data && data.totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 pt-4"
              aria-label="Pagination"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
          )}
        </main>
      </div>
    </>
  );
}
