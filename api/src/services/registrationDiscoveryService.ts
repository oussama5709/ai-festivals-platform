import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const FETCH_TIMEOUT_MS = 15000;

const PLATFORM_DOMAINS: Array<{ match: string; platform: string }> = [
  { match: 'filmfreeway.com',              platform: 'filmfreeway' },
  { match: 'festhome.com',                 platform: 'festhome' },
  { match: 'eventbrite.',                  platform: 'eventbrite' },
  { match: 'docs.google.com/forms',        platform: 'google-form' },
  { match: 'forms.gle',                    platform: 'google-form' },
  { match: 'submittable.com',              platform: 'submittable' },
  { match: 'easychair.org',                platform: 'easychair' },
  { match: 'ex-ordo.com',                  platform: 'ex-ordo' },
  { match: 'openreview.net',               platform: 'openreview' },
  { match: 'conftool.',                    platform: 'conftool' },
  { match: 'cmt3.research.microsoft.com',  platform: 'microsoft-cmt' },
  { match: 'pretalx.com',                  platform: 'pretalx' },
  { match: 'oxfordabstracts.com',          platform: 'oxford-abstracts' },
  { match: 'whova.com',                    platform: 'whova' },
  { match: 'openwater.org',                platform: 'openwater' },
  { match: 'getopenwater.com',             platform: 'openwater' },
];

const STRONG_KEYWORDS = [
  'apply now', 'submit now', 'register now', 'call for entries', 'open call',
  'application portal', 'entry form', 'official form', 'submission portal',
  'speaker submission', 'artist submission', 'paper submission',
  'abstract submission', 'poster submission', 'pitch competition',
  'innovation challenge', 'startup application', 'grant application',
  'residency application', 'hackathon registration', 'conference registration',
  'volunteer registration', 'workshop registration', 'masterclass registration',
];

const MEDIUM_KEYWORDS = [
  'apply', 'submit', 'submission', 'registration', 'register', 'participate',
  'contest', 'award', 'challenge', 'scholarship', 'competition',
];

const REJECT_PREFIXES = ['mailto:', 'tel:', 'javascript:', '#'];

export interface DiscoveredLink {
  url: string;
  platform: string;
  label: string | null;
  confidence: number;
}

export interface DiscoveryResult {
  resolvedBaseUrl: string;
  links: DiscoveredLink[];
  contactEmail: string | null;
  rulesPdfUrl: string | null;
  organizerName: string | null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function classifyPlatform(url: string, officialHost: string | null): string {
  const lower = url.toLowerCase();
  for (const { match, platform } of PLATFORM_DOMAINS) {
    if (lower.includes(match)) return platform;
  }
  const linkHost = hostOf(url);
  if (officialHost && linkHost && linkHost === officialHost) return 'official';
  return 'other';
}

function keywordScore(text: string): number {
  const t = text.toLowerCase().trim();
  if (!t) return 0;
  if (STRONG_KEYWORDS.some((k) => t.includes(k))) return 0.5;
  if (MEDIUM_KEYWORDS.some((k) => t.includes(k))) return 0.3;
  return 0;
}

function isRejected(href: string): boolean {
  const h = href.trim().toLowerCase();
  if (!h) return true;
  return REJECT_PREFIXES.some((p) => h.startsWith(p));
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export async function discoverRegistrationLinks(officialUrl: string): Promise<DiscoveryResult | null> {
  let html: string;
  let finalUrl = officialUrl;

  try {
    const res = await axios.get(officialUrl, {
      headers: HEADERS,
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    html = res.data;
    finalUrl = (res.request?.res?.responseUrl as string) ?? officialUrl;
  } catch {
    return null;
  }

  const $ = cheerio.load(html);
  const officialHost = hostOf(finalUrl);

  const candidates = new Map<string, DiscoveredLink>();

  $('a[href]').each((_: number, el: any) => {
    const rawHref = $(el).attr('href') ?? '';
    if (isRejected(rawHref)) return;

    let absolute: string;
    try {
      absolute = new URL(rawHref, finalUrl).toString();
    } catch {
      return;
    }

    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const platform = classifyPlatform(absolute, officialHost);
    const platformIsKnownExternal = platform !== 'other' && platform !== 'official';

    let confidence = keywordScore(text);
    if (platformIsKnownExternal) confidence = Math.max(confidence, 0.5);
    if (platform === 'official' && confidence > 0) confidence += 0.2;

    if (confidence <= 0) return;

    confidence = Math.min(1, confidence);

    const existing = candidates.get(absolute);
    if (!existing || confidence > existing.confidence) {
      candidates.set(absolute, { url: absolute, platform, label: text || null, confidence });
    }
  });

  const bodyText = $('body').text();
  const emailMatch = bodyText.match(EMAIL_RE);
  const contactEmail = emailMatch ? emailMatch[0] : null;

  let rulesPdfUrl: string | null = null;
  $('a[href$=".pdf" i]').each((_: number, el: any) => {
    if (rulesPdfUrl) return;
    const href = $(el).attr('href') ?? '';
    const text = $(el).text().toLowerCase();
    if (/rule|guideline|regulation|terms/.test(text) || /rule|guideline|regulation|terms/.test(href.toLowerCase())) {
      try {
        rulesPdfUrl = new URL(href, finalUrl).toString();
      } catch { /* ignore */ }
    }
  });

  const organizerName =
    $('meta[property="og:site_name"]').attr('content')?.trim() ||
    $('title').first().text().trim().split(/[-|–]/)[0]?.trim() ||
    null;

  const links = Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence);

  return {
    resolvedBaseUrl: finalUrl,
    links,
    contactEmail,
    rulesPdfUrl,
    organizerName: organizerName || null,
  };
}

export async function runRegistrationDiscovery(eventId: string, officialUrl: string | null): Promise<void> {
  if (!officialUrl) return;

  const result = await discoverRegistrationLinks(officialUrl);
  const now = new Date();

  if (!result) {
    await prisma.event.update({
      where: { id: eventId },
      data: { lastVerifiedAt: now },
    }).catch(() => {});
    return;
  }

  for (const link of result.links) {
    await prisma.registrationLink.upsert({
      where: { eventId_url: { eventId, url: link.url } },
      update: {
        platform: link.platform,
        label: link.label,
        confidence: link.confidence,
        status: 'unknown',
        isActive: true,
      },
      create: {
        eventId,
        url: link.url,
        platform: link.platform,
        label: link.label,
        confidence: link.confidence,
        status: 'unknown',
        isActive: true,
      },
    }).catch(() => {});
  }

  const active = await prisma.registrationLink.findMany({
    where: { eventId, isActive: true },
    orderBy: { confidence: 'desc' },
  });
  if (active.length > 0) {
    await prisma.registrationLink.update({
      where: { id: active[0]!.id },
      data: { isPrimary: true },
    }).catch(() => {});
    for (const link of active.slice(1)) {
      if (link.isPrimary) {
        await prisma.registrationLink.update({
          where: { id: link.id },
          data: { isPrimary: false },
        }).catch(() => {});
      }
    }
  }

  const topConfidence = result.links[0]?.confidence ?? 0;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      officialWebsite: result.resolvedBaseUrl,
      contactEmail: result.contactEmail ?? undefined,
      rulesPdfUrl: result.rulesPdfUrl ?? undefined,
      organizerName: result.organizerName ?? undefined,
      lastVerifiedAt: now,
      registrationConfidence: topConfidence,
    },
  }).catch(() => {});
}

export async function runDiscoveryForNewEvents(
  events: Array<{ id: string; url?: string | null }>,
  concurrency = 5
): Promise<void> {
  let index = 0;

  async function worker(): Promise<void> {
    while (index < events.length) {
      const current = events[index++];
      if (!current?.url) continue;
      await runRegistrationDiscovery(current.id, current.url).catch((err) => {
        console.error('[registrationDiscovery] failed for', current.id, (err as Error).message);
      });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, events.length) }, () => worker());
  await Promise.all(workers);
}
