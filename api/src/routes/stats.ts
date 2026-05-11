import { Router, Request, Response } from 'express';
import { getStats, getScrapeRuns } from '../services/eventService';
import { getCached, setCached } from '../services/cacheService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = getCached('stats');
    if (cached) {
      res.json(cached);
      return;
    }
    const stats = await getStats();
    setCached('stats', stats);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

router.get('/scrape-runs', async (_req: Request, res: Response) => {
  try {
    const runs = await getScrapeRuns();
    res.json(runs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scrape runs.' });
  }
});

export default router;
