import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { fetchDatasetItems } from '../services/apifyService';
import { upsertEvents, updateScrapeRun, createScrapeRun } from '../services/eventService';
import { invalidateCache } from '../services/cacheService';
import { notifyUser, sendTelegramAlert } from '../services/notificationService';
import { dbCircuit } from '../jobs/retry';
import { updateHealthFromRun } from '../jobs/monitor';

const router = Router();
const prisma = new PrismaClient();

function log(event: string, data?: object) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

// ── Region inference from address/location ────────────────────────────────────

function inferRegion(loc: string): string {
  const l = loc.toLowerCase();
  if (l.includes('dubai') || l.includes('uae') || l.includes('saudi') || l.includes('qatar') ||
      l.includes('kuwait') || l.includes('bahrain') || l.includes('jordan') || l.includes('egypt') ||
      l.includes('middle east') || l.includes('arab')) return 'middle-east';
  if (l.includes('africa') || l.includes('nigeria') || l.includes('kenya') || l.includes('ghana') ||
      l.includes('ethiopia') || l.includes('morocco') || l.includes('cairo')) return 'africa';
  if (l.includes('europe') || l.includes('london') || l.includes('paris') || l.includes('berlin') ||
      l.includes('amsterdam') || l.includes('vienna') || l.includes('madrid') || l.includes('rome')) return 'europe';
  if (l.includes('asia') || l.includes('china') || l.includes('japan') || l.includes('india') ||
      l.includes('singapore') || l.includes('korea') || l.includes('hong kong') || l.includes('tokyo')) return 'asia';
  if (l.includes('usa') || l.includes('canada') || l.includes('brazil') || l.includes('mexico') ||
      l.includes('new york') || l.includes('san francisco') || l.includes('boston') ||
      l.includes('americas') || l.includes('chicago') || l.includes('toronto')) return 'americas';
  return 'worldwide';
}

function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase().replace(/[^a-z]/g, '');
  if (c.includes('conference') || c.includes('conf')) return 'conference';
  if (c.includes('workshop')) return 'workshop';
  if (c.includes('webinar')) return 'webinar';
  if (c.includes('meetup') || c.includes('meet')) return 'meetup';
  if (c.includes('summit')) return 'summit';
  if (c.includes('hackathon') || c.includes('hack')) return 'hackathon';
  if (c.includes('course')) return 'course';
  return 'conference';
}

function parseDateRange(dates: string): { start: Date | null; end: Date | null } {
  if (!dates || dates === 'TBD - TBD') return { start: null, end: null };
  const parts = dates.split(' - ');
  const start = parts[0] ? new Date(parts[0].trim()) : null;
  const end = parts[1] ? new Date(parts[1].trim()) : null;
  return {
    start: start && !isNaN(start.getTime()) ? start : null,
    end: end && !isNaN(end.getTime()) ? end : null,
  };
}

// ── Dual-schema mapper ────────────────────────────────────────────────────────
// Handles both:
//   A) New format: { title, url, date, location, region, category, qualityScore, ... }
//   B) Actor format: { name, sitePage, address, dates, category, source, ... }

export function mapToEvent(item: Record<string, unknown>): Prisma.EventCreateInput | null {
  // Detect format by key presence
  const isActorFormat = typeof item['name'] === 'string' && !item['title'];

  let title: string;
  let url: string | null;
  let location: string | null;
  let date: Date | null;
  let endDate: Date | null;
  let region: string;
  let category: string;
  let source: string;
  let qualityScore: number;
  let isOnline: boolean;

  if (isActorFormat) {
    title = String(item['name'] ?? '').trim();
    if (!title || title.length < 3) return null;

    const siteUrl = String(item['sitePage'] ?? item['regLink'] ?? '');
    // Skip LinkedIn login redirects / garbage URLs
    if (siteUrl.includes('linkedin.com/checkpoint') || siteUrl.includes('login')) return null;

    url = siteUrl || null;
    location = String(item['address'] ?? '').trim() || null;
    const { start, end } = parseDateRange(String(item['dates'] ?? ''));
    date = start;
    endDate = end;
    region = location ? inferRegion(location) : 'worldwide';
    category = normalizeCategory(String(item['category'] ?? 'conference'));
    source = String(item['source'] ?? 'unknown').toLowerCase();
    const confidence = Number(item['aiConfidence'] ?? 50);
    const enrichScore = Number(item['enrichScore'] ?? 0);
    qualityScore = Math.min(1, (confidence / 100) * 0.7 + (enrichScore / 10) * 0.3);
    isOnline = String(item['address'] ?? '').toLowerCase().includes('online');
  } else {
    title = String(item['title'] ?? '').trim();
    if (!title || title.length < 3) return null;
    url = item['url'] ? String(item['url']) : null;
    location = item['location'] ? String(item['location']) : null;
    date = item['date'] ? new Date(String(item['date'])) : null;
    endDate = item['endDate'] ? new Date(String(item['endDate'])) : null;
    region = String(item['region'] ?? 'worldwide');
    category = normalizeCategory(String(item['category'] ?? 'conference'));
    source = String(item['source'] ?? 'unknown');
    qualityScore = Number(item['qualityScore'] ?? 0.5);
    isOnline = Boolean(item['isOnline'] ?? false);
  }

  return {
    title,
    description: item['description'] ? String(item['description']) : null,
    date: date && !isNaN(date.getTime()) ? date : null,
    endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
    location,
    isOnline,
    url,
    source,
    region,
    regionArabic: item['regionArabic'] ? String(item['regionArabic']) : null,
    category,
    qualityScore: Math.max(0, Math.min(1, qualityScore)),
    scrapedAt: new Date(),
  };
}

// ── Core processing logic (shared by webhook + manual ingest) ─────────────────

async function processItems(
  items: Record<string, unknown>[],
  runId: string
): Promise<number> {
  const mapped = items.map(mapToEvent).filter((e): e is Prisma.EventCreateInput => e !== null);

  if (dbCircuit.isOpen()) {
    log('webhook.circuit_open', { runId });
    throw new Error('DB circuit breaker open');
  }

  try {
    const saved = await upsertEvents(mapped);
    dbCircuit.onSuccess();
    invalidateCache();

    for (const event of mapped) {
      if (
        event.title.includes('Film') || event.title.includes('Cinema') ||
        event.title.includes('فيلم') || event.title.includes('سينما')
      ) {
        notifyUser(event);
      }
    }

    log('webhook.saved', { runId, total: items.length, mapped: mapped.length, saved });
    return saved;
  } catch (err) {
    dbCircuit.onFailure();
    throw err;
  }
}

// ── POST /api/webhook/apify — Apify platform webhook ─────────────────────────

router.post('/apify', async (req: Request, res: Response) => {
  const { eventType, eventData } = req.body as {
    eventType: string;
    eventData: { actorRunId: string; defaultDatasetId: string; status: string };
  };

  const runId = eventData?.actorRunId;
  log('webhook.received', { eventType, runId });

  // Idempotency
  try {
    const existing = await prisma.scrapeRun.findUnique({ where: { apifyRunId: runId } });
    if (existing?.status === 'succeeded') {
      log('webhook.duplicate', { runId });
      res.json({ ok: true, duplicate: true });
      return;
    }
  } catch { /* non-fatal */ }

  if (eventType !== 'ACTOR.RUN.SUCCEEDED') {
    try {
      await updateScrapeRun(runId, {
        status: eventData.status?.toLowerCase() ?? 'failed',
        completedAt: new Date(),
        errorMessage: eventType === 'ACTOR.RUN.FAILED' ? 'Actor run failed' : undefined,
      });
      updateHealthFromRun('failed');
    } catch (err) {
      log('webhook.update_failed', { runId, error: (err as Error).message });
    }
    res.json({ ok: true });
    return;
  }

  try {
    const startTime = Date.now();
    const items = await fetchDatasetItems(eventData.defaultDatasetId) as Record<string, unknown>[];
    const saved = await processItems(items, runId);
    const durationMs = Date.now() - startTime;

    await updateScrapeRun(runId, {
      status: 'succeeded',
      eventsFound: saved,
      completedAt: new Date(),
      durationMs,
    });

    updateHealthFromRun('succeeded');

    await sendTelegramAlert(
      `✅ <b>AI Festivals — Webhook processed</b>\n` +
      `Saved <b>${saved}</b> events in ${Math.round(durationMs / 1000)}s.`
    ).catch(() => {});

    res.json({ ok: true, saved });
  } catch (err) {
    updateHealthFromRun('failed');
    log('webhook.error', { runId, error: (err as Error).message });
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

// ── POST /api/webhook/apify/ingest — manual dataset ingestion ─────────────────
// Body: { runId: string, datasetId: string }

router.post('/apify/ingest', async (req: Request, res: Response) => {
  const { runId, datasetId } = req.body as { runId?: string; datasetId: string };
  const effectiveRunId = runId ?? `manual-${Date.now()}`;

  log('webhook.ingest', { runId: effectiveRunId, datasetId });

  try {
    const items = await fetchDatasetItems(datasetId) as Record<string, unknown>[];

    // Ensure ScrapeRun record exists
    try {
      await createScrapeRun(effectiveRunId, ['worldwide']);
    } catch { /* already exists */ }

    const startTime = Date.now();
    const saved = await processItems(items, effectiveRunId);
    const durationMs = Date.now() - startTime;

    await updateScrapeRun(effectiveRunId, {
      status: 'succeeded',
      eventsFound: saved,
      completedAt: new Date(),
      durationMs,
    }).catch(() => {});

    updateHealthFromRun('succeeded');

    res.json({ ok: true, saved, total: items.length });
  } catch (err) {
    log('webhook.ingest.error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
