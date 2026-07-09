import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { runRegistrationDiscovery } from '../services/registrationDiscoveryService';

const prisma = new PrismaClient();

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const INITIAL_DELAY_MS = 5 * 60 * 1000;       // first run 5 min after boot
const BATCH_SIZE = 50;
const CHECK_TIMEOUT_MS = 10_000;
const RECHECK_AFTER_MS = 6 * 60 * 60 * 1000;  // don't re-check a link within 6h of its last check

function log(event: string, data?: object): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

// ── Liveness/status, exposed via /api/health so "is it really running every
// 6h?" can be answered from the API instead of only from Railway logs. ───────

let lastRunAt: string | null = null;
let lastChecked = 0;
let lastBroken = 0;
let runCount = 0;

export function getLinkValidatorHealth(): {
  lastRunAt: string | null;
  lastChecked: number;
  lastBroken: number;
  runCount: number;
} {
  return { lastRunAt, lastChecked, lastBroken, runCount };
}

async function checkLinkAlive(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, {
      timeout: CHECK_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });
    if (res.status >= 200 && res.status < 400) return true;
    if (res.status === 405 || res.status === 501) {
      const getRes = await axios.get(url, {
        timeout: CHECK_TIMEOUT_MS,
        maxRedirects: 5,
        validateStatus: (s) => s < 500,
      });
      return getRes.status >= 200 && getRes.status < 400;
    }
    return false;
  } catch {
    return false;
  }
}

export async function validateRegistrationLinks(): Promise<void> {
  const cutoff = new Date(Date.now() - RECHECK_AFTER_MS);
  const eventSelect = { event: { select: { id: true, officialWebsite: true, url: true } } } as const;

  const neverChecked = await prisma.registrationLink.findMany({
    where: { isActive: true, lastCheckedAt: null },
    take: BATCH_SIZE,
    include: eventSelect,
  });

  const links = neverChecked.length >= BATCH_SIZE
    ? neverChecked
    : neverChecked.concat(
        await prisma.registrationLink.findMany({
          where: { isActive: true, lastCheckedAt: { lt: cutoff } },
          orderBy: { lastCheckedAt: 'asc' },
          take: BATCH_SIZE - neverChecked.length,
          include: eventSelect,
        })
      );

  if (links.length === 0) {
    log('linkValidator.nothing_due');
    lastRunAt = new Date().toISOString();
    runCount++;
    return;
  }

  log('linkValidator.start', { count: links.length });

  const eventsNeedingRediscovery = new Map<string, string>();

  for (const link of links) {
    const alive = await checkLinkAlive(link.url);
    const now = new Date();

    if (alive) {
      await prisma.registrationLink.update({
        where: { id: link.id },
        data: { status: 'valid', lastCheckedAt: now, lastValidAt: now },
      }).catch(() => {});
    } else {
      await prisma.registrationLink.update({
        where: { id: link.id },
        data: { status: 'broken', lastCheckedAt: now, isActive: false },
      }).catch(() => {});

      const officialUrl = link.event.officialWebsite ?? link.event.url;
      if (officialUrl) eventsNeedingRediscovery.set(link.event.id, officialUrl);
    }
  }

  for (const [eventId, officialUrl] of eventsNeedingRediscovery) {
    await runRegistrationDiscovery(eventId, officialUrl).catch((err) => {
      log('linkValidator.rediscovery_failed', { eventId, error: (err as Error).message });
    });
  }

  lastRunAt = new Date().toISOString();
  lastChecked = links.length;
  lastBroken = eventsNeedingRediscovery.size;
  runCount++;

  log('linkValidator.done', {
    checked: links.length,
    broken: eventsNeedingRediscovery.size,
  });
}

export function startLinkValidatorLoop(): void {
  setTimeout(() => {
    validateRegistrationLinks().catch((err) =>
      log('linkValidator.error', { error: (err as Error).message })
    );
    setInterval(() => {
      validateRegistrationLinks().catch((err) =>
        log('linkValidator.error', { error: (err as Error).message })
      );
    }, CHECK_INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  log('linkValidator.scheduled', { intervalHours: CHECK_INTERVAL_MS / 3_600_000 });
}
