import {
  triggerActorRun,
  getRunStatus,
  getRunDatasetId,
  fetchDatasetItems,
  isApifyConfigured,
} from '../services/apifyService';
import {
  createScrapeRun,
  updateScrapeRun,
  upsertEvents,
} from '../services/eventService';
import { invalidateCache } from '../services/cacheService';
import { sendTelegramAlert, notifyNewEvent, notifyDeadlineChange } from '../services/notificationService';
import { runDiscoveryForNewEvents } from '../services/registrationDiscoveryService';
import { withRetry, sleep, dbCircuit } from './retry';
import { mapToEvent } from '../routes/webhook';

const POLL_INTERVAL_MS = 30_000;
const MAX_POLL_DURATION_MS = 15 * 60_000;
const MAX_RUN_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [5 * 60_000, 15 * 60_000, 45 * 60_000];

function log(event: string, data?: object) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function processDataset(datasetId: string): Promise<number> {
  const items = await withRetry(
    () => fetchDatasetItems(datasetId),
    { maxAttempts: 3, baseDelayMs: 5_000, label: 'fetchDataset' }
  );

  const mapped = (items as Record<string, unknown>[])
    .map(mapToEvent)
    .filter((e): e is NonNullable<ReturnType<typeof mapToEvent>> => e !== null);

  if (dbCircuit.isOpen()) {
    log('pipeline.db.circuit_open - skipping upsert');
    return 0;
  }

  try {
    const { saved, newEvents, deadlineChanges } = await upsertEvents(mapped);
    dbCircuit.onSuccess();
    invalidateCache();

    for (const event of newEvents) {
      notifyNewEvent(event);
    }
    for (const change of deadlineChanges) {
      notifyDeadlineChange(change.event, change.kind, change.oldDeadline, change.newDeadline);
    }

    runDiscoveryForNewEvents(newEvents).catch((err) => {
      log('pipeline.registration_discovery.error', { error: (err as Error).message });
    });

    return saved;
  } catch (err) {
    dbCircuit.onFailure();
    throw err;
  }
}

async function pollUntilDone(runId: string): Promise<'SUCCEEDED' | 'FAILED' | 'TIMEOUT'> {
  const deadline = Date.now() + MAX_POLL_DURATION_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const status = await getRunStatus(runId);
    log('pipeline.poll', { runId, status });
    if (status === 'SUCCEEDED') return 'SUCCEEDED';
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') return 'FAILED';
  }
  return 'TIMEOUT';
}

async function executePipelineRun(
  regions: string[],
  maxResults: number
): Promise<{ success: boolean; saved: number; durationMs: number }> {
  const startMs = Date.now();
  log('pipeline.start', { regions, maxResults });

  const { runId } = await withRetry(
    () => triggerActorRun(regions, maxResults),
    { maxAttempts: 3, baseDelayMs: 10_000, label: 'triggerActorRun' }
  );

  await createScrapeRun(runId, regions);
  log('pipeline.triggered', { runId });

  const outcome = await pollUntilDone(runId);
  const durationMs = Date.now() - startMs;

  if (outcome === 'TIMEOUT') {
    await updateScrapeRun(runId, {
      status: 'failed',
      completedAt: new Date(),
      durationMs,
      errorMessage: 'Polling timed out after 15 minutes',
    });
    await sendTelegramAlert(
      `Scrape timeout: Run ${runId} did not complete in 15 min.`
    ).catch(() => {});
    log('pipeline.timeout', { runId, durationMs });
    return { success: false, saved: 0, durationMs };
  }

  if (outcome === 'FAILED') {
    await updateScrapeRun(runId, {
      status: 'failed',
      completedAt: new Date(),
      durationMs,
      errorMessage: 'Apify actor run failed',
    });
    log('pipeline.failed', { runId, durationMs });
    return { success: false, saved: 0, durationMs };
  }

  const datasetId = await getRunDatasetId(runId);
  if (!datasetId) {
    await updateScrapeRun(runId, {
      status: 'failed',
      completedAt: new Date(),
      durationMs,
      errorMessage: 'No dataset ID returned from run',
    });
    return { success: false, saved: 0, durationMs };
  }

  const saved = await processDataset(datasetId);

  await updateScrapeRun(runId, {
    status: 'succeeded',
    eventsFound: saved,
    completedAt: new Date(),
    durationMs,
  });

  await sendTelegramAlert(
    `AI Festivals - Scrape complete\n` +
    `Saved ${saved} events in ${Math.round(durationMs / 1000)}s.\n` +
    `Regions: ${regions.join(', ')}`
  ).catch(() => {});

  log('pipeline.succeeded', { runId, saved, durationMs });
  return { success: true, saved, durationMs };
}

export async function runPipeline(
  regions = ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
  maxResults = 500
): Promise<void> {
  if (!isApifyConfigured()) {
    log('pipeline.skipped', { reason: 'Apify not configured' });
    return;
  }

  for (let attempt = 1; attempt <= MAX_RUN_ATTEMPTS; attempt++) {
    try {
      const result = await executePipelineRun(regions, maxResults);
      if (result.success) return;

      const delay = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]!;
      log('pipeline.scheduling_retry', { attempt, delayMs: delay });

      if (attempt < MAX_RUN_ATTEMPTS) {
        await sleep(delay);
      } else {
        log('pipeline.exhausted', { attempts: MAX_RUN_ATTEMPTS });
        await sendTelegramAlert(
          `Pipeline exhausted: All ${MAX_RUN_ATTEMPTS} attempts failed. Manual intervention needed.`
        ).catch(() => {});
      }
    } catch (err) {
      log('pipeline.error', { attempt, error: (err as Error).message });
      if (attempt === MAX_RUN_ATTEMPTS) {
        await sendTelegramAlert(
          `Pipeline error: ${(err as Error).message}`
        ).catch(() => {});
      } else {
        const delay = RETRY_DELAYS_MS[attempt - 1] ?? 300_000;
        await sleep(delay);
      }
    }
  }
}
