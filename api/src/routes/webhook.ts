import { Router, Request, Response } from 'express';
import { fetchDatasetItems } from '../services/apifyService';
import { upsertEvents, updateScrapeRun } from '../services/eventService';
import { invalidateCache } from '../services/cacheService';
import { notifyUser } from '../services/notificationService';
import { Prisma } from '@prisma/client';

const router = Router();

router.post('/apify', async (req: Request, res: Response) => {
  try {
    const { eventType, eventData } = req.body as {
      eventType: string;
      eventData: { actorRunId: string; defaultDatasetId: string; status: string };
    };

    if (eventType !== 'ACTOR.RUN.SUCCEEDED') {
      await updateScrapeRun(eventData.actorRunId, {
        status: eventData.status.toLowerCase(),
        completedAt: new Date(),
        errorMessage: eventType === 'ACTOR.RUN.FAILED' ? 'Actor run failed' : undefined,
      });
      res.json({ ok: true });
      return;
    }

    const startTime = Date.now();
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
    invalidateCache();

    // Notify for film/cinema events (non-blocking)
    for (const event of mapped) {
      if (event.title.includes('Film') || event.title.includes('Cinema') ||
          event.title.includes('فيلم') || event.title.includes('سينما')) {
        notifyUser(event);
      }
    }

    await updateScrapeRun(eventData.actorRunId, {
      status: 'succeeded',
      eventsFound: saved,
      completedAt: new Date(),
      durationMs: Date.now() - startTime,
    });

    res.json({ ok: true, saved });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

export default router;
