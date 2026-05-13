import Link from 'next/link';
import { ApiStatus } from '@/components/ApiStatus';

const STATS = [
  { value: '97+',   label: 'events indexed' },
  { value: '200+',  label: 'countries' },
  { value: '100+',  label: 'sources' },
  { value: 'Daily', label: 'updates' },
];

const REGIONS = [
  { emoji: '🌎', label: 'Worldwide',   slug: 'worldwide' },
  { emoji: '🏜️', label: 'Middle East', slug: 'middle-east' },
  { emoji: '🌍', label: 'Africa',      slug: 'africa' },
  { emoji: '🇪🇺', label: 'Europe',      slug: 'europe' },
  { emoji: '🏯', label: 'Asia',        slug: 'asia' },
  { emoji: '🗽', label: 'Americas',    slug: 'americas' },
];

const FEATURED = [
  { title: 'NeurIPS 2025',    type: 'Conference', where: 'New Orleans, USA', when: 'Dec 9–15, 2025', score: 0.95, href: 'https://nips.cc' },
  { title: 'ICML 2025',       type: 'Conference', where: 'Vienna, Austria',  when: 'Jul 13–19, 2025', score: 0.92, href: 'https://icml.cc' },
  { title: 'AI Summit Dubai', type: 'Summit',     where: 'Dubai, UAE',       when: 'Oct 2025',        score: 0.87, href: '/events?region=middle-east' },
];

const FEATURES = [
  { icon: '🌍', title: 'Global coverage', desc: 'Events from 200+ countries — Eventbrite, Meetup, NeurIPS, ICML, and 95 more sources.' },
  { icon: '⭐', title: 'Quality scoring', desc: 'Every event scored 0–1 for completeness and relevance. Filter out the noise instantly.' },
  { icon: '🔌', title: 'Open API',        desc: 'Query by region, type, date, or quality. Integrates with n8n, Claude MCP, and more.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.12),transparent)]" />

        <div className="relative mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background/80 text-xs text-muted-foreground backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Updated daily from 100+ sources
        </div>

        <h1 className="relative text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
          Every AI event,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400 dark:to-indigo-400">
            everywhere
          </span>
        </h1>

        <p className="relative mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Conferences, workshops, hackathons, and meetups — automatically collected
          from NeurIPS, Eventbrite, Meetup, and 100 more sources. Always up to date.
        </p>

        <Link
          href="/events"
          className="relative mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search AI events
        </Link>

        <div className="relative mt-10 flex flex-wrap justify-center gap-2">
          {REGIONS.map(r => (
            <Link
              key={r.slug}
              href={`/events?region=${r.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/60 text-sm hover:border-foreground/40 hover:bg-muted/50 transition-all duration-150"
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured events */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Top events right now</h2>
          <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED.map(ev => (
            <a
              key={ev.title}
              href={ev.href}
              target={ev.href.startsWith('http') ? '_blank' : undefined}
              rel={ev.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group flex flex-col p-5 rounded-2xl border border-border bg-card hover:border-foreground/20 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 uppercase tracking-wide">
                  {ev.type}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{ev.score}</span>
              </div>
              <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{ev.title}</h3>
              <p className="text-sm text-muted-foreground">{ev.where}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{ev.when}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(f => (
            <div key={f.title}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">Run your own scrape</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Need fresh data for a specific region? Run the Apify actor directly.
            </p>
          </div>
          <a
            href="https://console.apify.com/actors/loNQJNHxL29nxjzmH"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-muted/50 text-sm font-medium transition-colors"
          >
            Run on Apify ↗
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2025 AI Festivals · MIT License</span>
          <div className="flex items-center gap-4">
            <ApiStatus />
            <Link href="/api-docs" className="hover:text-foreground transition-colors">API Docs</Link>
            <a
              href="https://github.com/oussama5709/ai-festivals-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
