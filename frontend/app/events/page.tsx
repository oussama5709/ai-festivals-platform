'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import SkeletonCard from '@/components/SkeletonCard';
import FilterSidebar, { Filters } from '@/components/FilterSidebar';
import { fetchEvents, fetchRegions, Event, EventsResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Grid3X3, List, SortAsc, SearchX } from 'lucide-react';

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
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setWaking(false);
    if (wakingRef.current) clearTimeout(wakingRef.current);
    wakingRef.current = setTimeout(() => setWaking(true), 4000);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'API_WAKING_UP' ? 'WAKING_UP' : (msg || 'Failed to load events'));
    } finally {
      if (wakingRef.current) clearTimeout(wakingRef.current);
      setWaking(false);
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
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="text-5xl">{error === 'WAKING_UP' ? '⏳' : '⚠️'}</div>
              <h2 className="text-xl font-medium text-foreground">
                {error === 'WAKING_UP' ? 'API is waking up...' : 'Could not load events'}
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                {error === 'WAKING_UP'
                  ? 'Our server takes ~30 seconds to start after inactivity. Please wait a moment and try again.'
                  : `Error: ${error}`}
              </p>
              <button
                onClick={() => load(filters, sort, page)}
                className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="flex flex-col gap-4">
              {waking && (
                <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-950/30 border border-amber-900/40 px-4 py-2.5 rounded-lg" role="status">
                  <span className="animate-pulse">⏳</span>
                  API is starting up — usually takes 20–30 seconds on first load...
                </div>
              )}
              <div className={cn(
                'grid gap-4',
                view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )} aria-label="Loading events">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
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
