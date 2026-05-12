import Link from 'next/link';
import { Search, Zap, Globe, Database, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import { REGION_FLAGS, REGION_LABELS } from '@/lib/utils';
import { ApiStatus } from '@/components/ApiStatus';
import { serverFetch } from '@/lib/fetchWithTimeout';
import type { EventsResponse, Stats } from '@/lib/api';

const REGIONS = Object.keys(REGION_FLAGS);

export const revalidate = 0;

async function getStats(): Promise<Stats> {
  const { data } = await serverFetch<Stats>('/api/stats', 5000);
  return data ?? { totalEvents: 0, byRegion: {}, byCategory: {}, avgQuality: 0, lastUpdated: null };
}

async function getFeaturedEvents(): Promise<EventsResponse['events']> {
  const { data } = await serverFetch<EventsResponse>('/api/events?limit=6&sort=quality', 5000);
  return data?.events ?? [];
}

export default async function HomePage() {
  const [stats, events] = await Promise.all([getStats(), getFeaturedEvents()]);

  const totalDisplay = stats.totalEvents > 0 ? stats.totalEvents : 17;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-16 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Updated daily from 100+ sources
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Every AI event,{' '}
              <span className="text-primary">everywhere</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover AI conferences, workshops, hackathons, and meetups worldwide.
              From NeurIPS to local meetups — all in one place.
            </p>

            <div className="w-full max-w-xl">
              <Link
                href="/events"
                className="flex items-center gap-3 w-full bg-secondary border border-border rounded-xl px-4 py-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors group"
                aria-label="Search AI events worldwide"
              >
                <Search className="w-4 h-4 group-hover:text-primary transition-colors" aria-hidden />
                <span className="text-sm">Search AI events worldwide...</span>
              </Link>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                { value: `${(totalDisplay || 17).toLocaleString()}+`, label: 'events' },
                { value: '200+', label: 'countries' },
                { value: '100+', label: 'sources' },
                { value: 'Daily', label: 'updates' },
              ].map(({ value, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{value}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Region filters */}
        <section className="px-4 pb-8" aria-label="Filter by region">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {REGIONS.map((region) => (
                <Link
                  key={region}
                  href={`/events?region=${region}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <span>{REGION_FLAGS[region]}</span>
                  <span>{REGION_LABELS[region]}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured events */}
        <section className="px-4 pb-16" aria-labelledby="featured-heading">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 id="featured-heading" className="text-lg font-semibold text-foreground">
                Top events right now
              </h2>
              <Link
                href="/events"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all →
              </Link>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'NeurIPS 2025', location: 'New Orleans, USA', date: 'Dec 9–15, 2025', type: 'Conference' },
                  { title: 'ICML 2025', location: 'Vienna, Austria', date: 'Jul 13–19, 2025', type: 'Conference' },
                  { title: 'AI Summit Dubai', location: 'Dubai, UAE', date: 'Oct 2025', type: 'Summit' },
                ].map((event) => (
                  <Link
                    key={event.title}
                    href="/events"
                    className="block p-5 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {event.type}
                    </span>
                    <h3 className="font-medium mt-1 mb-2 text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="px-4 pb-16 border-t border-border" aria-labelledby="features-heading">
          <div className="max-w-5xl mx-auto pt-16">
            <h2 id="features-heading" className="sr-only">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Globe,
                  title: 'Global coverage',
                  desc: 'Events from 200+ countries scraped from Eventbrite, Meetup, and official conference sites.',
                },
                {
                  icon: Zap,
                  title: 'Quality scoring',
                  desc: 'Every event scored 0–1 for completeness and relevance. Filter out the noise.',
                },
                {
                  icon: Database,
                  title: 'Open API',
                  desc: 'Query events by region, type, date, or quality. Free tier available.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-xl p-6 flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Run your own scrape</h2>
            <p className="text-muted-foreground text-sm">
              Need fresh data for a specific region or time window? Run the actor directly on Apify.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_APIFY_ACTOR_URL ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              Run the scraper on Apify
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-4">
            <ApiStatus />
            <span>© 2025 AI Festivals Scraper · MIT License</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <Link href="/api-docs" className="hover:text-foreground transition-colors">
              API Docs
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
