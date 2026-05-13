import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { CompetitionCard } from '@/components/CompetitionCard';

export const metadata: Metadata = {
  title: 'AI in Tunisia — AI Festivals',
  description:
    'Discover AI conferences, competitions, and hackathons in Tunisia. أحداث الذكاء الاصطناعي في تونس.',
};

interface TunisiaEvent {
  id: string;
  title: string;
  category: string;
  date: string | null;
  location: string | null;
  isOnline: boolean;
  isCompetition?: boolean;
  prize?: string | null;
  eligibility?: string | null;
  howToApply?: string | null;
  submissionDeadline?: string | null;
  competitionStatus?: string | null;
  hasCfp?: boolean;
  cfpDeadline?: string | null;
  cfpUrl?: string | null;
  isTunisia?: boolean;
  qualityScore: number;
  url?: string | null;
}

async function getTunisiaEvents(): Promise<TunisiaEvent[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events?isTunisia=true&limit=50`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

export default async function TunisiaPage() {
  const events = await getTunisiaEvents();
  const competitions = events.filter((e) => e.isCompetition);
  const openCfps = events.filter((e) => e.hasCfp);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-semibold mb-3">🇹🇳 AI in Tunisia</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Conférences, compétitions et hackathons IA en Tunisie
            <span className="mx-2 text-border">•</span>
            مؤتمرات ومسابقات الذكاء الاصطناعي في تونس
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-lg mx-auto">
          {[
            { value: events.length, label: 'Events' },
            { value: competitions.length, label: 'Competitions' },
            { value: openCfps.length, label: 'Open CFPs' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-4 rounded-xl bg-muted/30 border border-border"
            >
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Competitions section */}
        {competitions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              🏆 Open Competitions
              <span className="text-sm font-normal text-muted-foreground">
                ({competitions.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitions.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* CFP section */}
        {openCfps.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              📝 Call for Papers
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

        {/* All Tunisia events */}
        <section>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
            📅 All Tunisia AI Events
            <span className="text-sm font-normal text-muted-foreground">({events.length})</span>
          </h2>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <CompetitionCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-5xl mb-4">🇹🇳</p>
              <p className="text-lg">Tunisia events loading...</p>
              <p className="text-sm mt-2">Check back soon — new events added daily.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
