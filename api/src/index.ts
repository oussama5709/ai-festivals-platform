import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { rateLimiter } from './middleware/rateLimit';
import eventsRouter from './routes/events';
import scrapeRouter from './routes/scrape';
import statsRouter from './routes/stats';
import webhookRouter from './routes/webhook';
import adminRouter from './routes/admin';
import pipelineRouter from './routes/pipeline';
import { autoSeed } from './startup/autoSeed';
import { startKeepAlive } from './jobs/keepAlive';
import { startScheduler } from './jobs/scheduler';
import { getPipelineHealth } from './jobs/monitor';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(corsMiddleware);
app.use(rateLimiter);

app.get('/api/health', (_req, res) => {
  const pipeline = getPipelineHealth();
  res.json({
    status: pipeline.status === 'down' ? 'degraded' : 'ok',
    uptime: process.uptime(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    pipeline: {
      status: pipeline.status,
      lastRun: pipeline.lastRunAt,
      lastRunStatus: pipeline.lastRunStatus,
      consecutiveFailures: pipeline.consecutiveFailures,
      nextRun: pipeline.nextScheduledRun,
      dbCircuit: pipeline.dbCircuitState,
    },
  });
});

app.use('/api/events', eventsRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/stats', statsRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/admin', adminRouter);
app.use('/api/pipeline', pipelineRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, async () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'server.start', port: PORT }));
  await autoSeed();
  if (process.env.NODE_ENV === 'production') {
    startKeepAlive();
    startScheduler();
  }
});

export default app;
