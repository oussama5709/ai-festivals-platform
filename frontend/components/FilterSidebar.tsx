'use client';

import { useState, useCallback } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { cn, REGION_FLAGS, REGION_LABELS, CATEGORY_LABELS } from '@/lib/utils';

export interface Filters {
  search: string;
  regions: string[];
  categories: string[];
  minDate: string;
  maxDate: string;
  minQuality: number;
  isOnline: boolean;
  isFree: boolean;
  openCompetitions: boolean;
  hasCfp: boolean;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  regions: [],
  categories: [],
  minDate: '',
  maxDate: '',
  minQuality: 0.5,
  isOnline: false,
  isFree: false,
  openCompetitions: false,
  hasCfp: false,
};

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  regionCounts?: Record<string, number>;
}

export default function FilterSidebar({
  filters,
  onChange,
  regionCounts = {},
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(
    (key: 'regions' | 'categories', value: string) => {
      const arr = filters[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange]
  );

  const clearAll = () => onChange(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.regions.length > 0 ||
    filters.categories.length > 0 ||
    filters.minDate ||
    filters.maxDate ||
    filters.minQuality > 0.5 ||
    filters.isOnline ||
    filters.isFree ||
    filters.openCompetitions ||
    filters.hasCfp;

  const content = (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" aria-hidden />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" aria-hidden />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label htmlFor="sidebar-search" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Search
        </label>
        <input
          id="sidebar-search"
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search AI events worldwide..."
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search events"
        />
      </div>

      {/* Regions */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Region</p>
        <div className="flex flex-col gap-1.5">
          {Object.entries(REGION_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.regions.includes(value)}
                onChange={() => toggle('regions', value)}
                className="rounded border-border accent-primary"
                aria-label={`Filter by ${label}`}
              />
              <span className="flex-1 flex items-center gap-1.5 group-hover:text-foreground text-muted-foreground transition-colors">
                <span>{REGION_FLAGS[value]}</span>
                <span>{label}</span>
              </span>
              {regionCounts[value] !== undefined && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {regionCounts[value]}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Event Type</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggle('categories', value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                filters.categories.includes(value)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={filters.categories.includes(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Range</p>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={filters.minDate}
            onChange={(e) => onChange({ ...filters, minDate: e.target.value })}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Start date"
          />
          <input
            type="date"
            value={filters.maxDate}
            onChange={(e) => onChange({ ...filters, maxDate: e.target.value })}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="End date"
          />
        </div>
      </div>

      {/* Quality score */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Min quality score
          <span className="ml-1.5 text-foreground font-semibold">{filters.minQuality.toFixed(1)}</span>
        </p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={filters.minQuality}
          onChange={(e) => onChange({ ...filters, minQuality: Number(e.target.value) })}
          className="w-full accent-primary"
          aria-label={`Minimum quality score: ${filters.minQuality}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.0</span>
          <span>1.0</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isOnline}
            onChange={(e) => onChange({ ...filters, isOnline: e.target.checked })}
            className="rounded border-border accent-primary"
            aria-label="Online events only"
          />
          <span className="text-muted-foreground">Online events only</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isFree}
            onChange={(e) => onChange({ ...filters, isFree: e.target.checked })}
            className="rounded border-border accent-primary"
            aria-label="Free events only"
          />
          <span className="text-muted-foreground">Free events only</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.openCompetitions}
            onChange={(e) => onChange({ ...filters, openCompetitions: e.target.checked })}
            className="rounded border-border accent-primary"
            aria-label="Open competitions only"
          />
          <span className="text-muted-foreground">🏆 Open competitions only</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasCfp}
            onChange={(e) => onChange({ ...filters, hasCfp: e.target.checked })}
            className="rounded border-border accent-primary"
            aria-label="Open Call for Papers"
          />
          <span className="text-muted-foreground">📝 Open Call for Papers (CFP)</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-lg"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="w-5 h-5" aria-hidden />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto w-80 max-w-full h-full bg-card border-l border-border overflow-y-auto p-5">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="glass-card rounded-xl p-5">{content}</div>
      </aside>
    </>
  );
}
