import { Router, Request, Response } from 'express';
import { queryEvents, getEventById, getRegions } from '../services/eventService';
import { getCached, setCached } from '../services/cacheService';

const router = Router();

// ── Cache-Control helpers ─────────────────────────────────────────────────────
// Tells CDN/browser to cache list responses for 60s, detail for 5min
function setCacheHeaders(res: Response, seconds: number) {
  res.set('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const cacheKey = `events:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setCacheHeaders(res, 60);
      res.json(cached);
      return;
    }

    const result = await queryEvents({
      region: req.query['region'] as string,
      type: req.query['type'] as string,
      minDate: req.query['minDate'] as string,
      maxDate: req.query['maxDate'] as string,
      minQuality: req.query['minQuality'] ? Number(req.query['minQuality']) : undefined,
      search: req.query['search'] as string,
      page: req.query['page'] ? Number(req.query['page']) : 1,
      limit: req.query['limit'] ? Number(req.query['limit']) : 20,
      sort: req.query['sort'] as 'date' | 'quality' | 'relevance',
      isOnline: req.query['isOnline'] === 'true' ? true : req.query['isOnline'] === 'false' ? false : undefined,
      openCompetitions: req.query['openCompetitions'] === 'true',
      hasCfp: req.query['hasCfp'] === 'true',
      isTunisia: req.query['isTunisia'] === 'true',
    });

    setCached(cacheKey, result);
    setCacheHeaders(res, 60);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

router.get('/regions', async (_req: Request, res: Response) => {
  try {
    const cached = getCached('regions');
    if (cached) {
      setCacheHeaders(res, 300);
      res.json(cached);
      return;
    }
    const regions = await getRegions();
    setCached('regions', regions);
    setCacheHeaders(res, 300);
    res.json(regions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch regions.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await getEventById(req.params['id']!);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    setCacheHeaders(res, 300);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event.' });
  }
});

export default router;
