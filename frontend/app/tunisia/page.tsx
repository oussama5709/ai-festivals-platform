'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { CompetitionCard } from '@/components/CompetitionCard';
import { PushSubscribeButton } from '@/components/PushSubscribeButton';

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
  festivalType?: string | null;
  governorate?: string | null;
  organizerType?: string | null;
  qualityScore: number;
  url?: string | null;
}

const CATEGORY_TABS = [
  { id: 'all',         label: 'الكل',           emoji: '🇹🇳' },
  { id: 'ai',          label: 'ذكاء اصطناعي',   emoji: '🤖' },
  { id: 'hackathon',   label: 'هاكاثون',         emoji: '💻' },
  { id: 'cinema',      label: 'سينما',            emoji: '🎬' },
  { id: 'photo',       label: 'تصوير وصورة',     emoji: '📸' },
  { id: 'mixed-image', label: 'فنون مختلطة',     emoji: '🎭' },
];

export default function TunisiaPage() {
  const [events, setEvents] = useState<TunisiaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/api/events?isTunisia=true&limit=100`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === 'all'
      ? events
      : events.filter((e) => e.festivalType === activeTab);

  const openCompetitions = filtered.filter(
    (e) => e.isCompetition && e.competitionStatus === 'open'
  );
  const openCfps = filtered.filter(
    (e) => e.hasCfp && e.cfpDeadline && new Date(e.cfpDeadline) > new Date()
  );
  const upcomingCompetitions = filtered.filter(
    (e) => e.isCompetition && e.competitionStatus !== 'open'
  );
  const otherEvents = filtered.filter(
    (e) => !e.isCompetition && !(e.hasCfp && e.cfpDeadline && new Date(e.cfpDeadline) > new Date())
  );

  // Prize pool — TND equivalent
  const totalPrizeTND = events
    .filter((e) => e.prizeAmount)
    .reduce((sum, e) => {
      if (!e.prizeAmount) return sum;
      return sum + (e.prizeCurrency === 'USD' ? e.prizeAmount * 3.1 : e.prizeAmount);
    }, 0);

  const formatPrize = (tnd: number) =>
    tnd >= 1000 ? `${Math.round(tnd / 1000)}k TND` : `${Math.round(tnd)} TND`;

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
          <h1 className="text-4xl font-bold mb-3">🇹🇳 الذكاء الاصطناعي والثقافة في تونس</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            مسابقات، مهرجانات سينما، تصوير وفنون في بلادنا
            <span className="mx-2 text-border">•</span>
            <span dir="ltr" lang="fr">IA, Cinéma, Photo &amp; Arts en Tunisie</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
          {[
            { value: events.length, label: 'الفعاليات' },
            { value: events.filter((e) => e.isCompetition && e.competitionStatus === 'open').length, label: 'مسابقات مفتوحة' },
            { value: events.filter((e) => e.hasCfp && e.cfpDeadline && new Date(e.cfpDeadline) > new Date()).length, label: 'CFP مفتوحة' },
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

        {/* Push notifications subscribe */}
        <div className="flex justify-center mb-6">
          <PushSubscribeButton topics={['ai-competitions', 'tunisia']} />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              aria-pressed={activeTab === tab.id}
            >
              {tab.emoji} {tab.label}
            </button>
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
              مفتوحة توّه
              <span className="text-sm font-normal text-muted-foreground">({openCompetitions.length})</span>
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
              <span className="text-sm font-normal text-muted-foreground">({openCfps.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openCfps.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming/closed competitions */}
        {upcomingCompetitions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              🏆 مسابقات أخرى
              <span className="text-sm font-normal text-muted-foreground">({upcomingCompetitions.length})</span>
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
              📅 فعاليات وثقافة
              <span className="text-sm font-normal text-muted-foreground">({otherEvents.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherEvents.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium">ما لقيناش فعاليات في هاذي الفئة</p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              شوف الكل ←
            </button>
          </div>
        )}

        {/* CTA */}
        <section className="mt-16 text-center py-10 px-6 rounded-2xl border border-border bg-muted/20">
          <p className="text-2xl mb-2">🚀</p>
          <h2 className="text-lg font-semibold mb-2">أضف فعاليتك</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
            عندك فعالية في تونس؟ قولنا عليها وإلّا اتواصل معانا.
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
