import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Globe, Calendar, ExternalLink, Share2, CalendarPlus,
  ArrowLeft, Info,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import { fetchEvent, fetchEvents, generateIcsContent } from '@/lib/api';
import {
  formatDate, qualityColor, qualityLabel, REGION_FLAGS,
  CATEGORY_LABELS, REGION_LABELS,
} from '@/lib/utils';

interface PageProps {
  params: { id: string };
}

export default async function EventDetailPage({ params }: PageProps) {
  let event;
  try {
    event = await fetchEvent(params.id);
  } catch {
    notFound();
  }

  const relatedData = await fetchEvents({
    region: event.region,
    type: event.category,
    limit: 3,
  }).catch(() => ({ events: [] }));

  const related = relatedData.events.filter((e) => e.id !== event.id).slice(0, 3);
  const icsContent = generateIcsContent(event);
  const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to events
        </Link>

        <article className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                {CATEGORY_LABELS[event.category] ?? event.category}
              </span>
              <span className="text-lg" aria-label={`Region: ${REGION_LABELS[event.region] ?? event.region}`}>
                {REGION_FLAGS[event.region] ?? '🌐'}
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${qualityColor(event.qualityScore)}`}
                  title={qualityLabel(event.qualityScore)}
                  aria-hidden
                />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {event.qualityScore.toFixed(2)} quality
                </span>
                <button
                  className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Quality score reflects data completeness and source reliability (0–1)"
                  aria-label="About quality score"
                >
                  <Info className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {event.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden />
                  <span>
                    {formatDate(event.date)}
                    {event.endDate && ` – ${formatDate(event.endDate)}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {event.isOnline ? (
                  <Globe className="w-4 h-4" aria-hidden />
                ) : (
                  <MapPin className="w-4 h-4" aria-hidden />
                )}
                <span>{event.isOnline ? 'Online event' : (event.location ?? 'Location TBD')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">Source:</span>
                <span className="text-foreground">{event.source}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Arabic region name */}
          {event.regionArabic && (
            <div
              dir="rtl"
              className="text-sm text-muted-foreground font-arabic border-t border-border pt-4"
            >
              المنطقة: <span className="text-foreground font-medium">{event.regionArabic}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" aria-hidden />
                View event site
              </a>
            )}
            <a
              href={icsDataUri}
              download={`${event.title.replace(/\s+/g, '-')}.ics`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Add to calendar"
            >
              <CalendarPlus className="w-4 h-4" aria-hidden />
              Add to Calendar
            </a>
            <button
              onClick={undefined}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Share event"
            >
              <Share2 className="w-4 h-4" aria-hidden />
              Share
            </button>
          </div>
        </article>

        {/* Related events */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-base font-semibold text-foreground mb-4">
              More events in {REGION_LABELS[event.region] ?? event.region}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((e, i) => (
                <EventCard key={e.id} event={e} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
