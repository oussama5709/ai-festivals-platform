'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { RegistrationCard } from '@/components/RegistrationCard';
import SkeletonCard from '@/components/SkeletonCard';
import { fetchEvents, Event } from '@/lib/api';
import { SearchX } from 'lucide-react';

const OPEN_STATUSES = 'open,opening_soon,closing_soon';

export default function OpenRegistrationsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents({ registrationStatus: OPEN_STATUSES, sort: 'date', limit: 60 })
      .then((res) => setEvents(res.events))
      .catch(() => setError('Failed to load open registrations.'))
      .finally(() => setLoading(false));
  }, []);

  // Closing-soon and open-with-a-known-deadline first, undated ones last.
  const sorted = [...events].sort((a, b) => {
    const da = a.registrationClosesAt ?? a.submissionDeadline ?? a.cfpDeadline;
    const db = b.registrationClosesAt ?? b.submissionDeadline ?? b.cfpDeadline;
    if (da && db) return new Date(da).getTime() - new Date(db).getTime();
    if (da) return -1;
    if (db) return 1;
    return 0;
  });

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Open Registrations</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Every festival, competition, conference, grant, hackathon or scholarship
            currently accepting applications — sourced and verified automatically from
            official organizer websites.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="text-5xl">⚠️</div>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <SearchX className="w-7 h-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="font-medium text-foreground">No open registrations right now</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              The registration discovery engine checks official event sites continuously —
              check back soon, or browse all events instead.
            </p>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((event) => (
              <RegistrationCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
