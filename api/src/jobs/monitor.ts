import { PrismaClient } from '@prisma/client';
import { sendTelegramAlert } from '../services/notificationService';
import { dbCircuit } from './retry';

const prisma = new PrismaClient();

function log(event: string, data?: object) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

// ── In-memory pipeline health ─────────────────────────────────────────────────

export interface PipelineHealth {
  status: 'ok' | 'degraded' | 'down';
  lastRunAt: string | null;
  lastRunStatus: string | null;
  consecutiveFailures: number;
  dbCircuitState: string;
  nextScheduledRun: string | null;
}

let health: PipelineHealth = {
  status: 'ok',
  lastRunAt: null,
  lastRunStatus: null,
  consecutiveFailures: 0,
  dbCircuitState: 'closed',
  nextScheduledRun: null,
};

export function updateHealthFromRun(status: 'succeeded' | 'failed'): void {
  health.lastRunAt = new Date().toISOString();
  health.lastRunStatus = status;
  health.dbCircuitState = dbCircuit.getState();
  if (status === 'succeeded') {
    health.consecutiveFailures = 0;
    health.status = 'ok';
  } else {
    health.consecutiveFailures++;
    health.status = health.consecutiveFailures >= 3 ? 'down' : 'degraded';
  }
}

export function setNextScheduledRun(iso: string): void {
  health.nextScheduledRun = iso;
}

export function getPipelineHealth(): PipelineHealth {
  return { ...health, dbCircuitState: dbCircuit.getState() };
}

// ── Check for stale data ──────────────────────────────────────────────────────

async function checkStaleness(): Promise<void> {
  if (dbCircuit.isOpen()) return;

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.event.count({
      where: { createdAt: { gte: cutoff } },
    });

    log('monitor.stale_check', { recentCount, cutoffHours: 24 });

    if (recentCount < 10) {
      await sendTelegramAlert(
        `⚠️ <b>AI Festivals — Stale data</b>\n` +
        `Only <b>${recentCount}</b> new events in the last 24h. Pipeline may be stuck.`
      ).catch(() => {});
    }
  } catch (err) {
    log('monitor.stale_check.error', { error: (err as Error).message });
  }
}

// ── Check consecutive failures ────────────────────────────────────────────────

async function checkConsecutiveFailures(): Promise<void> {
  if (dbCircuit.isOpen()) return;

  try {
    const recent = await prisma.scrapeRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 3,
    });

    if (recent.length < 3) return;

    const allFailed = recent.every((r) => r.status === 'failed');
    if (allFailed) {
      log('monitor.consecutive_failures', { count: recent.length });
      await sendTelegramAlert(
        `🚨 <b>AI Festivals — ${recent.length} consecutive scrape failures</b>\n` +
        `Last run: ${recent[0]?.startedAt.toISOString()}\n` +
        `Error: ${recent[0]?.errorMessage ?? 'unknown'}`
      ).catch(() => {});
    }
  } catch (err) {
    log('monitor.consecutive_check.error', { error: (err as Error).message });
  }
}

// ── Public: run all monitor checks ───────────────────────────────────────────

export async function runMonitorChecks(): Promise<void> {
  log('monitor.run');
  await Promise.allSettled([
    checkStaleness(),
    checkConsecutiveFailures(),
  ]);
}
