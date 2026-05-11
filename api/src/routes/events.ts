import { Router, Request, Response } from 'express';
import { queryEvents, getEventById, getRegions } from '../services/eventService';
import { getCached, setCached } from '../services/cacheService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const cacheKey = `events:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    if (cached) {
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
    });

    setCached(cacheKey, result);
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
      res.json(cached);
      return;
    }
    const regions = await getRegions();
    setCached('regions', regions);
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
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event.' });
  }
});

export default router;
