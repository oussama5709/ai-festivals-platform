import { Router, Request, Response } from 'express';
import { getScrapeRuns } from '../services/eventService';
import { getPipelineHealth } from '../jobs/monitor';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const [runs, health] = await Promise.all([
      getScrapeRuns(),
      Promise.resolve(getPipelineHealth()),
    ]);

    res.json({
      health,
      recentRuns: runs.slice(0, 10).map((r) => ({
        id: r.id,
        apifyRunId: r.apifyRunId,
        status: r.status,
        eventsFound: r.eventsFound,
        regions: JSON.parse(r.regions),
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        durationMs: r.durationMs,
        errorMessage: r.errorMessage,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pipeline status.' });
  }
});

export default router;
