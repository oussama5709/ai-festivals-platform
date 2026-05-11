import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { rateLimiter } from './middleware/rateLimit';
import eventsRouter from './routes/events';
import scrapeRouter from './routes/scrape';
import statsRouter from './routes/stats';
import webhookRouter from './routes/webhook';
import adminRouter from './routes/admin';
import { autoSeed } from './startup/autoSeed';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(corsMiddleware);
app.use(rateLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/events', eventsRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/stats', statsRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  await autoSeed();
});

export default app;
