'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { CompetitionCard } from '@/components/CompetitionCard';

interface TunisiaEvent {
  id: string;
  title: string;
  category: string;
  date: string | null;
  endDate?: string | null;
  location: string | null;
  isOnline: boolean;
  isCompetition?: boolean;
  prize?: string | null;
  prizeAmount?: number | null;
  prizeCurrency?: string | null;
  eligibility?: string | null;
  howToApply?: string | null;
  submissionDeadline?: string | null;
  competitionStatus?: string | null;
  hasCfp?: boolean;
  cfpDeadline?: string | null;
  cfpUrl?: string | null;
  cfpDescription?: string | null;
  isTunisia?: boolean;
  qualityScore: number;
  url?: string | null;
}

export default function TunisiaPage() {
  const [events, setEvents] = useState<TunisiaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/api/events?isTunisia=true&limit=50`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const openCompetitions = events.filter(
    (e) => e.isCompetition && e.competitionStatus === 'open'
  );
  const upcomingCompetitions = events.filter(
    (e) => e.isCompetition && e.competitionStatus !== 'open'
  );
  const openCfps = events.filter(
    (e) => e.hasCfp && e.cfpDeadline && new Date(e.cfpDeadline) > new Date()
  );
  const otherEvents = events.filter(
    (e) => !e.isCompetition && !e.hasCfp
  );

  // Total prize pool in TND (rough conversion: $1 ≈ 3.1 TND)
  const totalPrizeTND = events
    .filter((e) => e.prizeAmount)
    .reduce((sum, e) => {
      if (!e.prizeAmount) return sum;
      if (e.prizeCurrency === 'USD') return sum + e.prizeAmount * 3.1;
      return sum + e.prizeAmount;
    }, 0);

  const formatPrize = (tnd: number) => {
    if (tnd >= 1000) return `${Math.round(tnd / 1000)}k TND`;
    return `${Math.round(tnd)} TND`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4 animate-pulse">🇹🇳</div>
          <p className="text-muted-foreground">تحميل الفعاليات...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12" dir="rtl" lang="ar">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">🇹🇳 الذكاء الاصطناعي في تونس</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            مؤتمرات، مسابقات وهاكاثون في بلادنا
            <span className="mx-2 text-border">•</span>
            <span dir="ltr" lang="fr">Conférences, compétitions et hackathons en Tunisie</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
          {[
            { value: events.length, label: 'الفعاليات' },
            { value: openCompetitions.length, label: 'مسابقات مفتوحة' },
            { value: openCfps.length, label: 'CFP مفتوحة' },
            { value: formatPrize(totalPrizeTND), label: 'مجموع الجوائز' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-4 rounded-xl bg-muted/30 border border-border"
            >
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Open competitions — first */}
        {openCompetitions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              مسابقات مفتوحة توّه
              <span className="text-sm font-normal text-muted-foreground">
                ({openCompetitions.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openCompetitions.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Open CFPs */}
        {openCfps.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              📝 دعوات مفتوحة للأوراق البحثية
              <span className="text-sm font-normal text-muted-foreground">
                ({openCfps.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openCfps.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming competitions */}
        {upcomingCompetitions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              🔵 مسابقات قريباً
              <span className="text-sm font-normal text-muted-foreground">
                ({upcomingCompetitions.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingCompetitions.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Other events */}
        {otherEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              📅 كل فعاليات الذكاء الاصطناعي في تونس
              <span className="text-sm font-normal text-muted-foreground">
                ({otherEvents.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherEvents.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">🇹🇳</p>
            <p className="text-lg font-medium">الفعاليات تتحمّل...</p>
            <p className="text-sm mt-2">ارجع شوف مرة أخرى — نضيفو فعاليات جديدة كل يوم.</p>
          </div>
        )}

        {/* CTA — Add your event */}
        <section className="mt-16 text-center py-10 px-6 rounded-2xl border border-border bg-muted/20">
          <p className="text-2xl mb-2">🚀</p>
          <h2 className="text-lg font-semibold mb-2">أضف فعاليتك</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
            عندك فعالية في تونس؟ قولنا عليها وإلّا اتواصل معانا وإلّا افتح issue على GitHub.
          </p>
          <a
            href="mailto:contact@ai-festivals.io?subject=Tunisia%20Event%20Submission"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            تواصل معانا ←
          </a>
        </section>

      </main>
    </>
  );
}
