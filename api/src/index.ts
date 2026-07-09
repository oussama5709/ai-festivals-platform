import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { corsMiddleware } from './middleware/cors';
import { rateLimiter } from './middleware/rateLimit';
import {
  globalRateLimit, speedLimiter, sanitizeInputs,
  detectBots, securityHeaders, honeypotRoutes, trackViolations,
} from './middleware/security';
import eventsRouter from './routes/events';
import scrapeRouter from './routes/scrape';
import statsRouter from './routes/stats';
import webhookRouter from './routes/webhook';
import adminRouter from './routes/admin';
import pipelineRouter from './routes/pipeline';
import notificationsRouter from './routes/notifications';
import { autoSeed } from './startup/autoSeed';
import { startKeepAlive } from './jobs/keepAlive';
import { startScheduler } from './jobs/scheduler';
import { getPipelineHealth, getMonitorHealth } from './jobs/monitor';
import { getLinkValidatorHealth } from './jobs/linkValidator';

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet({ contentSecurityPolicy: false })); // CSP off — API-only server
app.use(compression());
app.use(securityHeaders);
app.use(detectBots);
app.use(express.json());
app.use(corsMiddleware);
app.use(trackViolations);
app.use(globalRateLimit);
app.use(speedLimiter);
app.use(rateLimiter);
app.use(sanitizeInputs);

app.get('/api/health', (_req, res) => {
  const pipeline = getPipelineHealth();
  const monitor = getMonitorHealth();
  const linkValidator = getLinkValidatorHealth();

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
    // Independent liveness for the recurring jobs — these run on their own
    // in-process loops (setInterval), so their "lastRun" only advances if the
    // loop is actually alive. If lastRun stops advancing across polls, the
    // process likely restarted/crashed without the loop restarting.
    monitor: {
      lastRun: monitor.lastRunAt,
      runCount: monitor.runCount,
      expectedIntervalMin: 30,
    },
    linkValidator: {
      lastRun: linkValidator.lastRunAt,
      runCount: linkValidator.runCount,
      lastChecked: linkValidator.lastChecked,
      lastBroken: linkValidator.lastBroken,
      expectedIntervalHours: 6,
    },
  });
});

app.use('/api/events', eventsRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/stats', statsRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/admin', adminRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/notifications', notificationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Honeypot traps — register before 404 handler
honeypotRoutes(app);

const server = app.listen(PORT, async () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'server.start', port: PORT }));
  await autoSeed();
  if (process.env.NODE_ENV === 'production') {
    startKeepAlive();
    startScheduler();
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'server.shutdown', signal }));
  server.close(async () => {
    await prisma.$disconnect();
    console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'server.stopped' }));
    process.exit(0);
  });
  // Force exit if drain takes >10s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;
