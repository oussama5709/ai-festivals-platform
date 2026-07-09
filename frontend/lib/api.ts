const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  isOnline: boolean;
  url: string | null;
  source: string;
  region: string;
  regionArabic: string | null;
  category: string;
  qualityScore: number;
  scrapedAt: string;
  createdAt: string;
  // Competition fields
  isCompetition: boolean;
  prize: string | null;
  prizeAmount: number | null;
  prizeCurrency: string | null;
  eligibility: string | null;
  howToApply: string | null;
  submissionDeadline: string | null;
  competitionStatus: string | null;
  // CFP fields
  hasCfp: boolean;
  cfpDeadline: string | null;
  cfpUrl: string | null;
  cfpDescription: string | null;
  // Tunisia
  isTunisia: boolean;
  // Registration Intelligence
  officialWebsite: string | null;
  registrationStatus: RegistrationStatus | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  participationCost: number | null;
  currency: string | null;
  isFree: boolean | null;
  countryRestrictions: string | null;
  ageRestrictions: string | null;
  requiredDocuments: string | null;
  rulesPdfUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  organizerName: string | null;
  organizerWebsite: string | null;
  lastVerifiedAt: string | null;
  registrationConfidence: number | null;
  registrationLinks: RegistrationLink[];
}

export type RegistrationStatus =
  | 'open' | 'opening_soon' | 'closing_soon' | 'closed'
  | 'cancelled' | 'waiting_list' | 'invitation_only' | 'unknown';

export interface RegistrationLink {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  isPrimary: boolean;
  confidence: number;
  status: string;
}

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  open: 'Open',
  opening_soon: 'Opening soon',
  closing_soon: 'Closing soon',
  closed: 'Closed',
  cancelled: 'Cancelled',
  waiting_list: 'Waiting list',
  invitation_only: 'Invitation only',
  unknown: 'Unknown',
};

export const PLATFORM_LABELS: Record<string, string> = {
  official: 'Official website',
  filmfreeway: 'FilmFreeway',
  festhome: 'Festhome',
  eventbrite: 'Eventbrite',
  'google-form': 'Google Form',
  submittable: 'Submittable',
  easychair: 'EasyChair',
  'ex-ordo': 'Ex Ordo',
  openreview: 'OpenReview',
  conftool: 'ConfTool',
  'microsoft-cmt': 'Microsoft CMT',
  pretalx: 'Pretalx',
  'oxford-abstracts': 'Oxford Abstracts',
  whova: 'Whova',
  openwater: 'OpenWater',
  other: 'Registration link',
};

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Stats {
  totalEvents: number;
  byRegion: Record<string, number>;
  byCategory: Record<string, number>;
  avgQuality: number;
  lastUpdated: string | null;
}

export interface ScrapeRun {
  id: string;
  apifyRunId: string;
  status: string;
  eventsFound: number;
  regions: string[];
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface EventsQuery {
  region?: string;
  type?: string;
  minDate?: string;
  maxDate?: string;
  minQuality?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  isOnline?: boolean;
  isFree?: boolean;
  openCompetitions?: boolean;
  hasCfp?: boolean;
  isTunisia?: boolean;
  registrationStatus?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('API_WAKING_UP');
    }
    throw err;
  }
}

export async function fetchEvents(query: EventsQuery = {}): Promise<EventsResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return apiFetch<EventsResponse>(`/api/events${qs ? `?${qs}` : ''}`);
}

export async function fetchEvent(id: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}`);
}

export async function fetchStats(): Promise<Stats> {
  return apiFetch<Stats>('/api/stats');
}

export async function fetchScrapeRuns(): Promise<ScrapeRun[]> {
  return apiFetch<ScrapeRun[]>('/api/stats/scrape-runs');
}

export async function fetchRegions(): Promise<Array<{ region: string; count: number }>> {
  return apiFetch('/api/events/regions');
}

export async function triggerScrape(
  apiKey: string,
  regions: string[],
  maxResults: number
): Promise<{ runId: string; estimatedDuration: number; message: string }> {
  return apiFetch('/api/scrape/trigger', {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: JSON.stringify({ regions, maxResults }),
  });
}

export function generateIcsContent(event: Event): string {
  const start = event.date ? new Date(event.date) : new Date();
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 3600000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace('.000', '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Festivals Scraper//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@ai-festivals.io`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description ?? '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location ?? (event.isOnline ? 'Online' : '')}`,
    `URL:${event.url ?? ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
