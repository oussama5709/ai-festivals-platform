import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { fetchDatasetItems } from '../services/apifyService';
import { upsertEvents, updateScrapeRun } from '../services/eventService';
import { invalidateCache } from '../services/cacheService';
import { notifyUser, sendTelegramAlert } from '../services/notificationService';
import { dbCircuit } from '../jobs/retry';
import { updateHealthFromRun } from '../jobs/monitor';

const router = Router();
const prisma = new PrismaClient();

function log(event: string, data?: object) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

router.post('/apify', async (req: Request, res: Response) => {
  const { eventType, eventData } = req.body as {
    eventType: string;
    eventData: { actorRunId: string; defaultDatasetId: string; status: string };
  };

  const runId = eventData?.actorRunId;
  log('webhook.received', { eventType, runId });

  // ── Idempotency: skip if already succeeded ────────────────────────────────
  try {
    const existing = await prisma.scrapeRun.findUnique({ where: { apifyRunId: runId } });
    if (existing?.status === 'succeeded') {
      log('webhook.duplicate', { runId });
      res.json({ ok: true, duplicate: true });
      return;
    }
  } catch {
    // non-fatal — proceed
  }

  if (eventType !== 'ACTOR.RUN.SUCCEEDED') {
    try {
      await updateScrapeRun(runId, {
        status: eventData.status.toLowerCase(),
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

    if (dbCircuit.isOpen()) {
      log('webhook.circuit_open', { runId });
      res.status(503).json({ error: 'DB circuit open — retry later' });
      return;
    }

    const items = await fetchDatasetItems(eventData.defaultDatasetId);

    const mapped: Prisma.EventCreateInput[] = (items as Record<string, unknown>[]).map((item) => ({
      title: String(item['title'] ?? ''),
      description: item['description'] ? String(item['description']) : null,
      date: item['date'] ? new Date(String(item['date'])) : null,
      endDate: item['endDate'] ? new Date(String(item['endDate'])) : null,
      location: item['location'] ? String(item['location']) : null,
      isOnline: Boolean(item['isOnline'] ?? false),
      url: item['url'] ? String(item['url']) : null,
      source: String(item['source'] ?? 'unknown'),
      region: String(item['region'] ?? 'worldwide'),
      regionArabic: item['regionArabic'] ? String(item['regionArabic']) : null,
      category: String(item['category'] ?? 'conference'),
      qualityScore: Number(item['qualityScore'] ?? 0.5),
      scrapedAt: new Date(),
    }));

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

    log('webhook.succeeded', { runId, saved, durationMs });
    res.json({ ok: true, saved });
  } catch (err) {
    dbCircuit.onFailure();
    updateHealthFromRun('failed');
    log('webhook.error', { runId, error: (err as Error).message });
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

export default router;
