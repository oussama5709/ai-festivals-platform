import { Router, Request, Response } from 'express';
import { requireApiKey } from '../middleware/auth';
import { triggerActorRun } from '../services/apifyService';
import { createScrapeRun } from '../services/eventService';

const router = Router();

router.post('/trigger', requireApiKey, async (req: Request, res: Response) => {
  try {
    const { regions = ['worldwide'], maxResults = 500 } = req.body as {
      regions?: string[];
      maxResults?: number;
    };

    const { runId, estimatedDuration } = await triggerActorRun(regions, maxResults);
    await createScrapeRun(runId, regions);

    res.json({
      runId,
      estimatedDuration,
      message: 'Scrape started! Check back in a few minutes.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to trigger scrape. Check your Apify credentials.' });
  }
});

export default router;
